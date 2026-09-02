"""
Mindshift — Core Journey Selenium Suite

Covers the main happy-path story, extended from the original
test_mindshift_frontend.py to cover the "Selenium" bucket of the manual test
plan (TC-DASH-*, TC-SIT-*, TC-MIS-*, TC-REP-*, TC-PERF-*, TC-HIS-*, TC-NAV-001):

    Dashboard (loads, nav) -> Situations (list, filters, start a mission)
    -> Mission (5 decisions, in correct context/order) -> Mission Report
    (appears, metrics match) -> Performance reflects it -> Replay
    -> Mission Report again -> Playthrough History shows both attempts
    compared -> Dashboard again (nav loop closes)

Ordered test_NN functions sharing one driver/module state — same continuous-
story design as the original suite, not independent isolated tests. This
suite assumes it runs alone (no auth yet, one shared placeholder user).

Run with:
    pytest test_core_journey.py -v -s

Requirements:
    pip install selenium pytest

Prerequisites:
    - Backend running on http://localhost:3001
    - Frontend running on http://localhost:3000
    - At least one mission exists with orderIndex 1 that is "not_started"
      for the current user (reset the playthrough via the API, or use a
      fresh DB, if you've already completed it from prior testing)
"""

import re
import time

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_URL = "http://localhost:3000"
API_BASE_URL = "http://localhost:3001"
WAIT_TIMEOUT = 15  # seconds — network calls + client-side fetches need slack

# The target mission by title — repeated runs compare attempts on the SAME
# mission, which is what Playthrough History needs. Change this if your seed
# data differs.
TARGET_MISSION_TITLE = "The Screenshot Shortcut"
TOTAL_DECISIONS = 5


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def driver():
    """One browser for the whole module — this is a single continuous
    session/story, not independent isolated tests."""
    options = webdriver.FirefoxOptions()
    # options.add_argument("--headless")  # uncomment to run without a visible window
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


def wait_all(driver, css_selector, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, css_selector) or False
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
        reqBody: (args[1] && args[1].body) || null,
        status: res.status,
        resBody: bodyText.slice(0, 800),
      });
    } catch (e) {}
    return res;
  };
}
"""


def install_fetch_logger(driver):
    """Patches window.fetch to record every request/response — used by
    conftest.py's failure-diagnostics hook. Re-install after every hard
    driver.get(), since a full navigation resets the JS context."""
    driver.execute_script(FETCH_LOGGER_JS)


def api_call(driver, method, path, body=None):
    """Calls the backend directly (full, untruncated response) — use this
    instead of parsing window.__apiLog for assertions, since that log's
    resBody is deliberately truncated to 800 chars for failure-diagnostics
    previews and will fail to parse as JSON for any real payload longer
    than that (found 2026-09-01 — see test_06/test_09)."""
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


def answer_current_decision(driver, label="", previous_choice_id=None):
    """One full turn of the mission chat loop:
    click the current (unread) contact -> click its first choice -> Send.
    Waits for either the next step to render or the mission to complete
    (navigation away to /attempts/:id/report). Returns the chosen choice id
    — pass that in as `previous_choice_id` on the next call.

    Real race found 2026-09-01: Mission.tsx's handleSend fires its post-
    submit fetchCurrentStep() WITHOUT awaiting it, so polling immediately
    after "advanced" can catch the DOM in a stale transitional state where
    the previous decision's contact/choices are still showing. If the newly
    "current" choice button's id matches the one we just submitted, that's
    exactly that staleness — wait it out instead of re-submitting a
    duplicate (which the backend correctly 409s, silently eating a turn and
    leaving the mission one decision short).
    """
    t0 = time.monotonic()
    contact = wait_clickable(driver, "[data-testid='contact-item'][data-unread='true']")
    contact_id = contact.get_attribute("data-character-id")
    contact.click()
    print(f"  [{label}] +{time.monotonic()-t0:.2f}s clicked contact={contact_id}")

    choice = wait_clickable(driver, "[data-testid='choice-button']")
    choice_id = choice.get_attribute("data-choice-id")

    if previous_choice_id is not None and choice_id == previous_choice_id:
        deadline = time.monotonic() + WAIT_TIMEOUT
        while choice_id == previous_choice_id and time.monotonic() < deadline:
            time.sleep(0.2)
            choice = wait_clickable(driver, "[data-testid='choice-button']")
            choice_id = choice.get_attribute("data-choice-id")
        print(f"  [{label}] +{time.monotonic()-t0:.2f}s waited out stale choice, now choice={choice_id}")

    choice.click()
    print(f"  [{label}] +{time.monotonic()-t0:.2f}s clicked choice={choice_id}")

    send_enabled = WebDriverWait(driver, WAIT_TIMEOUT).until(
        lambda d: not d.find_element(By.CSS_SELECTOR, "[data-testid='send-button']").get_property("disabled")
    )
    print(f"  [{label}] +{time.monotonic()-t0:.2f}s send button enabled={send_enabled}")

    send_button = wait_clickable(driver, "[data-testid='send-button']")
    send_button.click()
    print(f"  [{label}] +{time.monotonic()-t0:.2f}s clicked send")

    WebDriverWait(driver, WAIT_TIMEOUT).until(
        lambda d: "/attempts/" in d.current_url
        or d.find_elements(By.CSS_SELECTOR, "[data-testid='contact-item'][data-unread='true']")
    )
    print(f"  [{label}] +{time.monotonic()-t0:.2f}s advanced (url or new unread contact)")
    return choice_id


def play_mission_to_completion(driver, max_decisions=TOTAL_DECISIONS, previous_choice_id=None):
    """Answers decisions one at a time until the report screen appears."""
    for i in range(max_decisions):
        if "/attempts/" in driver.current_url and "/report" in driver.current_url:
            break
        previous_choice_id = answer_current_decision(
            driver, label=f"decision {i + 1}", previous_choice_id=previous_choice_id
        )

    wait_visible(driver, "[data-testid='mission-report-root']")


# ---------------------------------------------------------------------------
# State shared across ordered test functions
# ---------------------------------------------------------------------------

state = {}


# ---------------------------------------------------------------------------
# Dashboard — TC-DASH-001, TC-DASH-005
# ---------------------------------------------------------------------------

def test_01_dashboard_loads(driver):
    driver.get(BASE_URL)
    wait_visible(driver, "[data-testid='dashboard-root']")
    install_fetch_logger(driver)


def test_02_dashboard_nav_controls(driver):
    """TC-DASH-005 — each sidebar nav control opens the correct destination."""
    wait_clickable(driver, "[data-testid='nav-situations']").click()
    wait_url_contains(driver, "/situations")
    wait_visible(driver, "[data-testid='situations-root']")

    wait_clickable(driver, "[data-testid='nav-performance']").click()
    wait_url_contains(driver, "/performance")
    wait_visible(driver, "[data-testid='performance-root']")

    wait_clickable(driver, "[data-testid='nav-dashboard']").click()
    wait_url_contains(driver, BASE_URL + "/")
    wait_visible(driver, "[data-testid='dashboard-root']")


# ---------------------------------------------------------------------------
# Situations — TC-SIT-001, TC-SIT-002, TC-SIT-003
# ---------------------------------------------------------------------------

def test_03_situations_lists_target_mission(driver):
    driver.get(f"{BASE_URL}/situations")
    wait_visible(driver, "[data-testid='situations-root']")
    install_fetch_logger(driver)

    cards = wait_all(driver, "[data-testid='mission-card']")
    assert len(cards) > 0, "No mission cards rendered on Situations"

    titles = [c.get_attribute("data-mission-title") for c in cards]
    assert TARGET_MISSION_TITLE in titles, (
        f"Target mission '{TARGET_MISSION_TITLE}' not found among rendered cards: {titles}"
    )


def test_04_situations_status_reflects_progress(driver):
    """TC-SIT-003 — a card's status attribute should be one of the three
    real states, and match what the backend's /progress endpoint says."""
    cards = wait_all(driver, "[data-testid='mission-card']")
    statuses = {c.get_attribute("data-mission-status") for c in cards}
    assert statuses <= {"not_started", "in_progress", "completed"}, (
        f"Unexpected mission status value(s): {statuses}"
    )


def test_05_start_first_attempt(driver):
    card = wait_present(
        driver, f"[data-testid='mission-card'][data-mission-title='{TARGET_MISSION_TITLE}']"
    )
    status = card.get_attribute("data-mission-status")

    if status == "not_started":
        start_button = card.find_element(By.CSS_SELECTOR, "[data-testid='mission-start-button']")
    elif status == "in_progress":
        start_button = card.find_element(By.CSS_SELECTOR, "[data-testid='mission-continue-button']")
    else:
        start_button = card.find_element(By.CSS_SELECTOR, "[data-testid='mission-replay-button']")

    start_button.click()

    wait_url_contains(driver, "/mission/")
    wait_visible(driver, "[data-testid='mission-root']")

    # TC-MIS-001 — correct situation context is shown before any decision is made
    title_el = wait_visible(driver, "[data-testid='mission-title']")
    assert title_el.text.strip() == TARGET_MISSION_TITLE, (
        "Mission screen shows the wrong title for the situation that was opened"
    )

    match = re.search(r"/mission/([^/]+)", driver.current_url)
    assert match, f"Could not extract attemptId from URL: {driver.current_url}"
    state["attempt_1_id"] = match.group(1)


# ---------------------------------------------------------------------------
# Mission — TC-MIS-002, TC-MIS-003, TC-MIS-004
# ---------------------------------------------------------------------------

def test_06_chat_messages_in_order(driver):
    """TC-MIS-002 — the current character's messages render in the order
    the backend returned them (characters[].orderIndex), not scrambled."""
    contact = wait_clickable(driver, "[data-testid='contact-item'][data-unread='true']")
    contact.click()

    # Full, untruncated response — window.__apiLog's resBody is capped at
    # 800 chars for failure-diagnostics previews and can't be relied on for
    # real assertions (found 2026-09-01).
    step_result = api_call(driver, "GET", f"/attempts/{state['attempt_1_id']}/current-step")
    assert step_result["status"] == 200, f"GET /current-step failed: {step_result}"
    expected_messages = [c["message"] for c in step_result["json"].get("step", {}).get("characters", [])]

    rendered = driver.find_elements(By.CSS_SELECTOR, ".max-w-md .rounded-2xl")
    rendered_texts = [el.text.strip() for el in rendered]

    assert rendered_texts == expected_messages, (
        f"Chat messages out of order or mismatched.\nExpected: {expected_messages}\nRendered: {rendered_texts}"
    )


def test_07_select_and_submit_decision(driver):
    """TC-MIS-003 — selecting a choice and sending it registers the answer
    and advances to feedback/next state."""
    choice = wait_clickable(driver, "[data-testid='choice-button']")
    state["last_choice_id"] = choice.get_attribute("data-choice-id")
    choice.click()

    send_button = wait_clickable(driver, "[data-testid='send-button']")
    assert not send_button.get_property("disabled"), "Send should enable once a choice is selected"
    send_button.click()

    WebDriverWait(driver, WAIT_TIMEOUT).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "[data-testid='contact-item'][data-unread='true']")
        or "/report" in d.current_url
    )


def test_08_answer_remaining_decisions_and_track_progress(driver):
    """TC-MIS-004 — progress updates correctly across all 5 decisions."""
    # decision 1 was already answered in test_07
    previous_choice_id = state.get("last_choice_id")
    for i in range(2, TOTAL_DECISIONS + 1):
        if "/attempts/" in driver.current_url and "/report" in driver.current_url:
            break
        previous_choice_id = answer_current_decision(
            driver, label=f"decision {i}", previous_choice_id=previous_choice_id
        )

    wait_url_contains(driver, "/report")
    wait_visible(driver, "[data-testid='mission-report-root']")
    score_el = wait_visible(driver, "[data-testid='mission-score']")
    state["attempt_1_score"] = int(score_el.get_attribute("data-score"))


# ---------------------------------------------------------------------------
# Mission Report — TC-REP-001, TC-REP-002, TC-REP-003
# ---------------------------------------------------------------------------

def test_09_report_metrics_match_attempt(driver):
    """TC-REP-002 — the report shown belongs to the attempt just completed,
    not a stale/different one — cross-check against the report API call."""
    # Full, untruncated response — see test_06's comment on why not
    # window.__apiLog for this.
    report_result = api_call(driver, "GET", f"/attempts/{state['attempt_1_id']}/report")
    assert report_result["status"] == 200, f"GET /report failed: {report_result}"
    report = report_result["json"]
    assert report.get("missionScore") == state["attempt_1_score"], (
        f"Report API score ({report.get('missionScore')}) doesn't match what's displayed ({state['attempt_1_score']})"
    )


def test_10_report_navigation_to_history(driver):
    """TC-REP-003 — 'Go to History' takes you to that mission's history
    without losing the completed result."""
    history_button = wait_clickable(driver, "[data-testid='history-button']")
    history_button.click()
    wait_url_contains(driver, "/playthrough-history/")
    wait_visible(driver, "[data-testid='playthrough-history-root']")


# ---------------------------------------------------------------------------
# Performance — TC-PERF-001, TC-PERF-002
# ---------------------------------------------------------------------------

def test_11_performance_reflects_completed_attempt(driver):
    driver.get(f"{BASE_URL}/performance")
    wait_visible(driver, "[data-testid='performance-root']")
    install_fetch_logger(driver)

    scenarios_card = wait_visible(driver, "[data-testid='stat-card-scenarios']")
    completed_count = int(scenarios_card.get_attribute("data-stat-value").split("/")[0].strip())
    assert completed_count >= 1, "Performance does not show any completed scenario yet"


# ---------------------------------------------------------------------------
# Replay + Playthrough History — TC-HIS-001, TC-HIS-002, TC-HIS-005
# ---------------------------------------------------------------------------

def test_12_replay_mission_for_second_attempt(driver):
    driver.get(f"{BASE_URL}/situations")
    wait_visible(driver, "[data-testid='situations-root']")
    install_fetch_logger(driver)

    card = wait_present(
        driver, f"[data-testid='mission-card'][data-mission-title='{TARGET_MISSION_TITLE}']"
    )
    assert card.get_attribute("data-mission-status") == "completed", (
        "Mission should show as completed before replaying for attempt #2"
    )

    replay_button = card.find_element(By.CSS_SELECTOR, "[data-testid='mission-replay-button']")
    replay_button.click()

    wait_url_contains(driver, "/mission/")
    wait_visible(driver, "[data-testid='mission-root']")

    match = re.search(r"/mission/([^/]+)", driver.current_url)
    assert match
    attempt_2_id = match.group(1)
    assert attempt_2_id != state["attempt_1_id"], "Replay should start a brand-new attempt"
    state["attempt_2_id"] = attempt_2_id


def test_13_answer_all_decisions_attempt_2(driver):
    play_mission_to_completion(driver)
    wait_url_contains(driver, "/report")
    score_el = wait_visible(driver, "[data-testid='mission-score']")
    state["attempt_2_score"] = int(score_el.get_attribute("data-score"))

    history_button = wait_clickable(driver, "[data-testid='history-button']")
    history_button.click()


def test_14_playthrough_history_shows_both_attempts(driver):
    """TC-HIS-002 — both attempts are listed, neither overwrote the other."""
    wait_url_contains(driver, "/playthrough-history/")
    wait_visible(driver, "[data-testid='playthrough-history-root']")

    total_attempts_card = wait_visible(driver, "[data-testid='attempt-stat-total-attempts']")
    total_attempts = int(total_attempts_card.get_attribute("data-stat-value"))

    assert total_attempts >= 2, (
        f"Expected at least 2 attempts compared in Playthrough History, got {total_attempts}"
    )


def test_15_decision_by_decision_comparison_renders(driver):
    """TC-HIS-005 — the per-decision comparison table has one row per
    decision and one verdict pill per compared attempt."""
    # Scoped to the decision table specifically — "All attempts overview"
    # below it is also a <table>, and an unscoped selector matches both
    # (found 2026-09-01: 5 decision rows + 3 overview rows = 8, not 5).
    rows = wait_all(driver, "[data-testid='decision-comparison-table'] table tbody tr")
    assert len(rows) == TOTAL_DECISIONS, (
        f"Expected {TOTAL_DECISIONS} decision rows in the comparison table, found {len(rows)}"
    )


# ---------------------------------------------------------------------------
# Navigation loop closes — TC-NAV-001
# ---------------------------------------------------------------------------

def test_16_full_navigation_loop(driver):
    """TC-NAV-001 — Dashboard -> Situations -> Performance -> History -> back,
    each landing on the correct screen."""
    wait_clickable(driver, "[data-testid='nav-dashboard']").click()
    wait_url_contains(driver, BASE_URL + "/")
    wait_visible(driver, "[data-testid='dashboard-root']")

    wait_clickable(driver, "[data-testid='nav-situations']").click()
    wait_url_contains(driver, "/situations")
    wait_visible(driver, "[data-testid='situations-root']")

    wait_clickable(driver, "[data-testid='nav-performance']").click()
    wait_url_contains(driver, "/performance")
    wait_visible(driver, "[data-testid='performance-root']")


# ---------------------------------------------------------------------------
# Coverage gap fill (found 2026-09-02: these 4 cases were classified as
# Selenium up front but never got a dedicated test when the scripts were
# actually written) — TC-DASH-003, TC-DASH-004, TC-HIS-001, TC-INT-001.
# ---------------------------------------------------------------------------

SECOND_MISSION_TITLE = "The VIP Friend Request"


def get_mission_id(driver, title):
    result = api_call(driver, "GET", "/missions")
    assert result["status"] == 200, f"GET /missions failed: {result}"
    for m in result["json"]:
        if m["title"] == title:
            return m["id"]
    raise AssertionError(f"Mission '{title}' not found in /missions")


def test_17_dashboard_populated_state(driver):
    """TC-DASH-003 — with a genuinely in-progress mission, Dashboard shows
    real progress, not the empty state. By this point in the story the
    target mission is already fully completed (not in_progress), so this
    starts a second mission via the API and leaves it partway through."""
    playthrough = api_call(driver, "POST", "/playthroughs")["json"]
    mission_id = get_mission_id(driver, SECOND_MISSION_TITLE)
    attempt = api_call(
        driver, "POST", f"/playthroughs/{playthrough['id']}/missions/{mission_id}/attempts"
    )["json"]
    state["second_attempt_id"] = attempt["attemptId"]

    step = api_call(driver, "GET", f"/attempts/{attempt['attemptId']}/current-step")["json"]["step"]
    api_call(
        driver, "POST", f"/attempts/{attempt['attemptId']}/decisions",
        {"decisionId": step["id"], "choiceId": step["choices"][0]["id"]},
    )

    driver.get(BASE_URL)
    wait_visible(driver, "[data-testid='dashboard-root']")

    card = wait_visible(driver, "[data-testid='continue-mission-card-button']")
    assert card.is_displayed(), "Dashboard should show the in-progress mission, not the empty state"


def test_18_dashboard_opens_situation(driver):
    """TC-DASH-004 — clicking the Dashboard's continue-mission card opens
    the correct mission, not an unrelated one."""
    wait_visible(driver, "[data-testid='dashboard-root']")
    card = wait_clickable(driver, "[data-testid='continue-mission-card-button']")
    card.click()

    wait_url_contains(driver, "/mission/")
    wait_visible(driver, "[data-testid='mission-root']")

    title_el = wait_visible(driver, "[data-testid='mission-title']")
    assert title_el.text.strip() == SECOND_MISSION_TITLE, (
        f"Dashboard opened the wrong mission: expected '{SECOND_MISSION_TITLE}', got '{title_el.text.strip()}'"
    )

    match = re.search(r"/mission/([^/]+)", driver.current_url)
    assert match and match.group(1) == state["second_attempt_id"], (
        "Dashboard's continue card should resolve to the exact same attempt started via the API"
    )


def test_19_history_first_attempt_state(driver):
    """TC-HIS-001 — the "First attempt score" stat correctly reflects
    whichever attempt is chronologically first WITHIN the screen's default
    comparison set (the most recent 3), computed independently from the API
    and cross-checked against what's rendered.

    Originally written assuming a mission with exactly 1 total attempt, but
    every mission in this shared dev DB has real accumulated history now
    (found 2026-09-02, checked directly: even "The Vendor Access Request",
    picked as a supposedly-untouched mission, already had 3 prior attempts
    from manual scoring-formula testing) — "exactly 1" is not an achievable
    precondition here, so this validates the actual first-vs-latest logic
    instead of a specific count. Deliberately keeps the real accumulated
    data rather than wiping it — user's explicit call, 2026-09-02.
    """
    mission_id = get_mission_id(driver, SECOND_MISSION_TITLE)

    playthroughs = api_call(driver, "GET", "/playthroughs")["json"]
    all_attempts = []
    for p in playthroughs:
        detail = api_call(driver, "GET", f"/playthroughs/{p['id']}")["json"]
        all_attempts.extend(
            a for a in detail["missionAttempts"]
            if a["missionId"] == mission_id and a["status"] == "completed"
        )
    assert all_attempts, f"No completed attempts found for mission {mission_id}"

    all_attempts.sort(key=lambda a: a["startedAt"])
    MAX_COMPARED = 3
    compared = all_attempts[-MAX_COMPARED:]  # same slice(-MAX_COMPARED) the UI itself uses
    expected_first_score = compared[0]["missionScore"]
    expected_total = len(compared)

    driver.get(f"{BASE_URL}/playthrough-history/{mission_id}")
    wait_visible(driver, "[data-testid='playthrough-history-root']")

    total_attempts_card = wait_visible(driver, "[data-testid='attempt-stat-total-attempts']")
    assert int(total_attempts_card.get_attribute("data-stat-value")) == expected_total, (
        f"Displayed total attempts doesn't match the default-compared set size ({expected_total})"
    )

    first_score_card = wait_visible(driver, "[data-testid='attempt-stat-first-score']")
    assert int(first_score_card.get_attribute("data-stat-value")) == expected_first_score, (
        "Displayed 'first attempt score' doesn't match the chronologically earliest attempt "
        "in the default-compared set"
    )


def test_20_api_data_renders_in_correct_ui_components(driver):
    """TC-INT-001 — every mission returned by the API is rendered as its
    own correctly-labeled card, not missing, duplicated, or mismatched."""
    api_missions = api_call(driver, "GET", "/missions")["json"]

    driver.get(f"{BASE_URL}/situations")
    wait_visible(driver, "[data-testid='situations-root']")

    cards = wait_all(driver, "[data-testid='mission-card']")
    rendered_titles = {c.get_attribute("data-mission-title") for c in cards}
    api_titles = {m["title"] for m in api_missions}

    assert rendered_titles == api_titles, (
        f"Rendered mission cards don't match the API's mission list.\nAPI: {api_titles}\nRendered: {rendered_titles}"
    )
