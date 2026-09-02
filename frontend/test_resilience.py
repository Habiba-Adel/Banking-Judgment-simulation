"""
Mindshift — Resilience Selenium Suite

Covers the "perturbation" test cases: refresh, browser back, rapid
double-clicks, direct reloads, and the empty-dashboard precondition. Each
test is a short, mostly-independent scenario rather than part of one growing
narrative (unlike test_core_journey.py) — deliberately kept separate so a
failure here never risks corrupting the main happy-path story, and vice
versa.

Covers: TC-DASH-002, TC-DASH-006, TC-MIS-006, TC-MIS-007, TC-MIS-008,
TC-PERF-003, TC-NAV-002.

Run with:
    pytest test_resilience.py -v -s

Prerequisites: same as test_core_journey.py (backend on :3001, frontend on
:3000). test_01 resets the current playthrough via the API — this does NOT
delete any history (POST /playthroughs/:id/reset only marks it abandoned),
but it does mean any in-progress mission you were manually testing gets
closed out and a fresh playthrough starts. Re-run test_core_journey.py
afterward if you want real completed-attempt data back for manual poking.
"""

import re
import time

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"
API_BASE_URL = "http://localhost:3001"
WAIT_TIMEOUT = 15
TARGET_MISSION_TITLE = "The Screenshot Shortcut"


@pytest.fixture(scope="module")
def driver():
    options = webdriver.FirefoxOptions()
    drv = webdriver.Firefox(options=options)
    drv.implicitly_wait(1)
    yield drv
    drv.quit()


def wait_visible(driver, css_selector, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, css_selector))
    )


def wait_present(driver, css_selector, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, css_selector))
    )


def wait_clickable(driver, css_selector, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, css_selector))
    )


def wait_url_contains(driver, fragment, timeout=WAIT_TIMEOUT):
    WebDriverWait(driver, timeout).until(lambda d: fragment in d.current_url)


FETCH_LOGGER_JS = """
if (!window.__apiLogInstalled) {
  window.__apiLogInstalled = true;
  window.__apiLog = [];
  const origFetch = window.fetch.bind(window);
  window.fetch = async function(...args) {
    const res = await origFetch(...args);
    try {
      const clone = res.clone();
      const bodyText = await clone.text();
      window.__apiLog.push({
        url: String(args[0]),
        method: (args[1] && args[1].method) || "GET",
        status: res.status,
        resBody: bodyText.slice(0, 800),
      });
    } catch (e) {}
    return res;
  };
}
"""


def install_fetch_logger(driver):
    driver.execute_script(FETCH_LOGGER_JS)


def api_call(driver, method, path, body=None):
    """Calls the backend directly from the page's own JS context (so it
    shares the browser's network stack/CORS setup), bypassing the UI for
    test setup that doesn't need to be driven by clicks. Requires the page
    to already be loaded (any page — the fetch target is the backend, not
    the current origin)."""
    script = """
    const [apiBase, method, path, body, callback] = arguments;
    fetch(apiBase + path, {
      method: method,
      headers: body ? {'Content-Type': 'application/json'} : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(res => res.text().then(text => {
        let json = null;
        try { json = JSON.parse(text); } catch (e) {}
        callback({status: res.status, json: json});
      }))
      .catch(err => callback({status: 0, error: String(err)}));
    """
    return driver.execute_async_script(script, API_BASE_URL, method, path, body)


def get_target_mission_id(driver):
    result = api_call(driver, "GET", "/missions")
    assert result["status"] == 200, f"GET /missions failed: {result}"
    for m in result["json"]:
        if m["title"] == TARGET_MISSION_TITLE:
            return m["id"]
    raise AssertionError(f"Mission '{TARGET_MISSION_TITLE}' not found in /missions")


def start_fresh_playthrough(driver):
    """Resets the current playthrough (kept in history, not deleted) and
    starts a brand-new one — same action as the Restart Journey button."""
    current = api_call(driver, "POST", "/playthroughs")
    assert current["status"] in (200, 201), f"POST /playthroughs failed: {current}"
    reset = api_call(driver, "POST", f"/playthroughs/{current['json']['id']}/reset")
    # NestJS's default status for a plain @Post() route (no @HttpCode
    # override) is 201, not 200 — confirmed against playthroughs.controller.ts
    # (found 2026-09-01: this assertion was wrong, the endpoint was fine).
    assert reset["status"] == 201, f"POST /playthroughs/:id/reset failed: {reset}"
    fresh = api_call(driver, "POST", "/playthroughs")
    assert fresh["status"] in (200, 201), f"POST /playthroughs (fresh) failed: {fresh}"
    return fresh["json"]["id"]


# ---------------------------------------------------------------------------
# TC-DASH-002 — empty dashboard state
# ---------------------------------------------------------------------------

def test_01_empty_dashboard_state(driver):
    driver.get(BASE_URL)
    wait_visible(driver, "[data-testid='dashboard-root']")
    install_fetch_logger(driver)

    start_fresh_playthrough(driver)
    driver.get(BASE_URL)
    wait_visible(driver, "[data-testid='dashboard-root']")

    empty_state = WebDriverWait(driver, WAIT_TIMEOUT).until(
        EC.visibility_of_element_located((By.XPATH, "//p[contains(text(), 'No Simulation History Yet')]"))
    )
    assert empty_state.is_displayed(), "Empty-state message should show for a fresh playthrough"

    # No fabricated activity — there should be no MissionProgressCard rendered
    stray_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid='continue-mission-card-button']")
    assert len(stray_cards) == 0, "A fresh playthrough should not show any in-progress mission cards"


# ---------------------------------------------------------------------------
# TC-DASH-006 — dashboard refresh preserves state
# ---------------------------------------------------------------------------

def test_02_dashboard_refresh_preserves_in_progress_state(driver):
    mission_id = get_target_mission_id(driver)
    playthrough = api_call(driver, "POST", "/playthroughs")["json"]
    attempt = api_call(
        driver, "POST", f"/playthroughs/{playthrough['id']}/missions/{mission_id}/attempts"
    )["json"]

    # Answer one decision via the API so the mission shows as in_progress,
    # without driving a full UI playthrough just for setup.
    current_step = api_call(driver, "GET", f"/attempts/{attempt['attemptId']}/current-step")["json"]
    first_choice_id = current_step["step"]["choices"][0]["id"]
    api_call(
        driver, "POST", f"/attempts/{attempt['attemptId']}/decisions",
        {"decisionId": current_step["step"]["id"], "choiceId": first_choice_id},
    )

    driver.get(BASE_URL)
    wait_visible(driver, "[data-testid='dashboard-root']")
    card_before = wait_visible(driver, "[data-testid='continue-mission-card-button']")
    assert card_before.is_displayed()

    driver.refresh()
    wait_visible(driver, "[data-testid='dashboard-root']")
    card_after = wait_visible(driver, "[data-testid='continue-mission-card-button']")
    assert card_after.is_displayed(), "In-progress mission should still show after a refresh"


# ---------------------------------------------------------------------------
# TC-MIS-006 — decision not duplicated on rapid double-click
# ---------------------------------------------------------------------------

def test_03_rapid_double_click_does_not_duplicate_decision(driver):
    driver.get(f"{BASE_URL}/situations")
    wait_visible(driver, "[data-testid='situations-root']")
    install_fetch_logger(driver)

    card = wait_present(
        driver, f"[data-testid='mission-card'][data-mission-title='{TARGET_MISSION_TITLE}']"
    )
    card.find_element(By.CSS_SELECTOR, "[data-testid='mission-continue-button']").click()
    wait_visible(driver, "[data-testid='mission-root']")

    contact = wait_clickable(driver, "[data-testid='contact-item'][data-unread='true']")
    contact.click()
    choice = wait_clickable(driver, "[data-testid='choice-button']")
    choice.click()

    send_button = wait_clickable(driver, "[data-testid='send-button']")
    # Fire two clicks back-to-back — the UI should disable Send after the
    # first (isSending), and even if both reached the server, the backend's
    # unique (attempt_id, decision_id) constraint would 409 the second.
    send_button.click()
    try:
        send_button.click()
    except Exception:
        pass  # element may already be disabled/detached after the first click — that's fine

    time.sleep(2)  # let both requests (if two fired) resolve

    api_log = driver.execute_script("return window.__apiLog || [];")
    decision_posts = [e for e in api_log if e["method"] == "POST" and "/decisions" in e["url"]]
    successful = [e for e in decision_posts if e["status"] < 300]
    assert len(successful) == 1, (
        f"Expected exactly 1 successful decision submission, got {len(successful)}: {decision_posts}"
    )


# ---------------------------------------------------------------------------
# TC-MIS-007 — refresh mid-mission resumes correctly
# ---------------------------------------------------------------------------

def test_04_refresh_mid_mission_resumes_same_step(driver):
    match = re.search(r"/mission/([^/]+)", driver.current_url)
    assert match, "Expected to still be on a /mission/:attemptId URL from the previous test"
    attempt_id = match.group(1)

    before = api_call(driver, "GET", f"/attempts/{attempt_id}/current-step")["json"]
    step_before = before["step"]["id"] if before["step"] else None

    driver.refresh()
    wait_visible(driver, "[data-testid='mission-root']")

    after = api_call(driver, "GET", f"/attempts/{attempt_id}/current-step")["json"]
    step_after = after["step"]["id"] if after["step"] else None

    assert step_before == step_after, (
        f"Refreshing mid-mission should resume the SAME step, got {step_before} -> {step_after}"
    )


# ---------------------------------------------------------------------------
# TC-MIS-008 — browser Back during a mission doesn't corrupt state
# ---------------------------------------------------------------------------

def test_05_browser_back_does_not_corrupt_attempt(driver):
    match = re.search(r"/mission/([^/]+)", driver.current_url)
    attempt_id = match.group(1)

    driver.get(f"{BASE_URL}/situations")
    wait_visible(driver, "[data-testid='situations-root']")

    driver.back()
    wait_url_contains(driver, "/mission/")
    wait_visible(driver, "[data-testid='mission-root']")

    step_after_back = api_call(driver, "GET", f"/attempts/{attempt_id}/current-step")["json"]
    assert step_after_back.get("isComplete") is False or step_after_back.get("step") is not None, (
        "Attempt should still be resumable after browser back navigation"
    )


# ---------------------------------------------------------------------------
# TC-PERF-003 — performance consistent after refresh
# ---------------------------------------------------------------------------

def test_06_performance_consistent_after_refresh(driver):
    driver.get(f"{BASE_URL}/performance")
    wait_visible(driver, "[data-testid='performance-root']")

    def read_stats():
        cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid^='stat-card-']")
        return {c.get_attribute("data-testid"): c.get_attribute("data-stat-value") for c in cards}

    stats_before = read_stats()
    assert stats_before, "No stat cards rendered on Performance"

    driver.refresh()
    wait_visible(driver, "[data-testid='performance-root']")
    stats_after = read_stats()

    assert stats_before == stats_after, (
        f"Performance stats changed after a plain refresh with no new activity.\nBefore: {stats_before}\nAfter: {stats_after}"
    )


# ---------------------------------------------------------------------------
# TC-NAV-002 — direct reload on major pages
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("path,root_testid", [
    ("/", "dashboard-root"),
    ("/situations", "situations-root"),
    ("/performance", "performance-root"),
])
def test_07_direct_reload_on_major_pages(driver, path, root_testid):
    driver.get(f"{BASE_URL}{path}")
    wait_visible(driver, f"[data-testid='{root_testid}']")
    # A broken route would either 404 or leave the root testid missing —
    # wait_visible already asserts that; also check no leftover error state.
    # Scoped to <div> specifically (the app's actual error banners are all
    # `<div className="p-8 text-sm text-red-600">`) and filtered to non-empty
    # text — an unscoped selector also matched the sidebar's Logout button
    # (also red, always rendered, empty text when collapsed) as a false
    # positive (found 2026-09-01).
    error_banners = [
        el for el in driver.find_elements(By.CSS_SELECTOR, "div.text-red-600, div.text-red-500")
        if el.text.strip()
    ]
    assert not error_banners, f"Direct reload of {path} shows an error state: {[e.text for e in error_banners]}"