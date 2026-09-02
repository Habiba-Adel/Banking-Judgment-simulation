"""
Mindshift — Data Integrity Selenium Suite

Covers the History/Report correctness cases that map directly onto real
bugs found and fixed manually during development (2026-09-01):

  - getPlaythroughProgress had no ORDER BY, so "lastAttemptId" could resolve
    to an arbitrary old attempt instead of the true latest one (found via
    the Report button opening a stale attempt from hours earlier).
  - The Playthrough History screen's data (score progression, improvement,
    per-attempt-per-mission linkage) depends on that same ordering being
    correct end to end.

These are the highest-value regression tests in this suite precisely
because this exact class of bug has already shipped once — a script like
this would have caught it automatically instead of requiring manual replay.

Covers: TC-HIS-003, TC-HIS-004, TC-HIS-006.

Setup is driven directly via the backend API (not UI clicks) for speed and
determinism — these tests care about whether the DISPLAY is correct given
known data, not the mechanics of clicking through 5 decisions twice.

Run with:
    pytest test_data_integrity.py -v -s

Prerequisites: same as the other suites (backend on :3001, frontend on
:3000). Uses two missions ("The Screenshot Shortcut" and "The VIP Friend
Request") to test cross-mission linkage — adjust MISSION_A_TITLE /
MISSION_B_TITLE if your seed data differs.
"""

import time

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:3000"
API_BASE_URL = "http://localhost:3001"
WAIT_TIMEOUT = 20  # bumped +5s (2026-09-01) to test whether test_02's blank-report
# failure is genuine slowness vs. an actual render crash — see conversation.

MISSION_A_TITLE = "The Screenshot Shortcut"
MISSION_B_TITLE = "The VIP Friend Request"


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


def wait_all(driver, css_selector, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, css_selector) or False
    )


def api_call(driver, method, path, body=None):
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


def get_mission_id(driver, title):
    result = api_call(driver, "GET", "/missions")
    assert result["status"] == 200, f"GET /missions failed: {result}"
    for m in result["json"]:
        if m["title"] == title:
            return m["id"]
    raise AssertionError(f"Mission '{title}' not found in /missions")


def play_mission_via_api(driver, playthrough_id, mission_id, choice_index):
    """Starts (or resumes) an attempt for mission_id and submits all 5
    decisions picking the choice at `choice_index` (0=A, 1=B, ...) each
    time. Returns the completed attempt's report. Bypasses the UI entirely
    — this is test setup, not the thing under test."""
    start = api_call(
        driver, "POST", f"/playthroughs/{playthrough_id}/missions/{mission_id}/attempts"
    )
    assert start["status"] in (200, 201), f"start attempt failed: {start}"
    attempt_id = start["json"]["attemptId"]

    for _ in range(5):
        step_result = api_call(driver, "GET", f"/attempts/{attempt_id}/current-step")
        step = step_result["json"]["step"]
        if step is None:
            break
        choice_id = step["choices"][choice_index]["id"]
        submit = api_call(
            driver, "POST", f"/attempts/{attempt_id}/decisions",
            {"decisionId": step["id"], "choiceId": choice_id},
        )
        assert submit["status"] in (200, 201), f"submit decision failed: {submit}"
        time.sleep(0.2)  # keep pacing realistic-ish for the time/pressure scoring

    report = api_call(driver, "GET", f"/attempts/{attempt_id}/report")
    assert report["status"] == 200, f"get report failed: {report}"
    return attempt_id, report["json"]


def start_fresh_playthrough(driver):
    current = api_call(driver, "POST", "/playthroughs")["json"]
    api_call(driver, "POST", f"/playthroughs/{current['id']}/reset")
    fresh = api_call(driver, "POST", "/playthroughs")["json"]
    return fresh["id"]


# ---------------------------------------------------------------------------
# TC-HIS-006 — attempt details are linked to the correct situation
# ---------------------------------------------------------------------------

def test_01_report_button_resolves_the_correct_latest_attempt(driver):
    """This is exactly the bug found manually this session: with multiple
    attempts across two missions, the Report button for mission A must open
    mission A's latest attempt, never mission B's or a stale one."""
    driver.get(BASE_URL)
    wait_visible(driver, "[data-testid='dashboard-root']")

    playthrough_id = start_fresh_playthrough(driver)
    mission_a_id = get_mission_id(driver, MISSION_A_TITLE)
    mission_b_id = get_mission_id(driver, MISSION_B_TITLE)

    _, report_a = play_mission_via_api(driver, playthrough_id, mission_a_id, choice_index=1)
    _, report_b = play_mission_via_api(driver, playthrough_id, mission_b_id, choice_index=1)
    # Replay mission A again so it has a newer attempt than mission B —
    # this specific interleaving is what exposed the original bug.
    _, report_a2 = play_mission_via_api(driver, playthrough_id, mission_a_id, choice_index=0)

    progress = api_call(driver, "GET", f"/playthroughs/{playthrough_id}/progress")["json"]
    progress_a = next(p for p in progress if p["missionId"] == mission_a_id)
    progress_b = next(p for p in progress if p["missionId"] == mission_b_id)

    latest_a_report = api_call(driver, "GET", f"/attempts/{progress_a['lastAttemptId']}/report")["json"]
    latest_b_report = api_call(driver, "GET", f"/attempts/{progress_b['lastAttemptId']}/report")["json"]

    assert latest_a_report["missionTitle"] == MISSION_A_TITLE, (
        f"progress.lastAttemptId for mission A resolved to a report for '{latest_a_report['missionTitle']}' instead"
    )
    assert latest_b_report["missionTitle"] == MISSION_B_TITLE, (
        f"progress.lastAttemptId for mission B resolved to a report for '{latest_b_report['missionTitle']}' instead"
    )
    assert latest_a_report["missionScore"] == report_a2["missionScore"], (
        "Mission A's lastAttemptId should be the SECOND (later) attempt, not the first"
    )

    # Now confirm the UI's Report button actually uses this correctly.
    driver.get(f"{BASE_URL}/situations")
    wait_visible(driver, "[data-testid='situations-root']")
    card_a = wait_visible(
        driver, f"[data-testid='mission-card'][data-mission-title='{MISSION_A_TITLE}']"
    )
    card_a.find_element(By.CSS_SELECTOR, "[data-testid='mission-report-button']").click()
    wait_visible(driver, "[data-testid='mission-report-root']")

    score_el = wait_visible(driver, "[data-testid='mission-score']")
    assert int(score_el.get_attribute("data-score")) == report_a2["missionScore"], (
        "Report screen opened from mission A's card shows the wrong attempt's score"
    )


# ---------------------------------------------------------------------------
# TC-HIS-003, TC-HIS-004 — score progression & improvement metric
# ---------------------------------------------------------------------------

def test_02_score_progression_and_improvement_are_correct(driver):
    """Three attempts of the same mission with deliberately different
    choice quality (worst -> best -> mixed), verified against the UI in
    true chronological order — not whatever order the DB happens to
    return rows in."""
    playthrough_id = start_fresh_playthrough(driver)
    mission_id = get_mission_id(driver, MISSION_A_TITLE)

    # choice_index 0 is usually the impulsive/worst option in this mission's
    # content, 2 tends to be the deliberate/best one — see seed.ts if this
    # assumption ever needs revisiting.
    attempt_1, report_1 = play_mission_via_api(driver, playthrough_id, mission_id, choice_index=0)
    attempt_2, report_2 = play_mission_via_api(driver, playthrough_id, mission_id, choice_index=2)
    attempt_3, report_3 = play_mission_via_api(driver, playthrough_id, mission_id, choice_index=1)

    scores_in_play_order = [report_1["missionScore"], report_2["missionScore"], report_3["missionScore"]]

    driver.get(f"{BASE_URL}/situations")
    wait_visible(driver, "[data-testid='situations-root']")
    card = wait_visible(
        driver, f"[data-testid='mission-card'][data-mission-title='{MISSION_A_TITLE}']"
    )
    card.find_element(By.CSS_SELECTOR, "[data-testid='mission-report-button']").click()
    wait_visible(driver, "[data-testid='mission-report-root']")

    history_button = wait_visible(driver, "[data-testid='history-button']")
    history_button.click()
    wait_visible(driver, "[data-testid='playthrough-history-root']")

    # Overview table rows are ordered by runNumber ascending — must match
    # the order the attempts were actually played in.
    rows = wait_all(driver, "table tbody tr")
    displayed_scores = []
    for row in rows[-3:]:  # last 3 rows = the 3 attempts just created
        score_cell = row.find_elements(By.CSS_SELECTOR, "td")[2]  # Score column
        displayed_scores.append(int(score_cell.text.split("/")[0].strip()))

    assert displayed_scores == scores_in_play_order, (
        f"Score progression is out of order.\nPlayed order: {scores_in_play_order}\nDisplayed order: {displayed_scores}"
    )

    # Improvement = this attempt's score minus the PREVIOUS attempt's score
    # (not first-vs-latest) — matches PlaythroughHistory's own calculation.
    last_row_cells = rows[-1].find_elements(By.CSS_SELECTOR, "td")
    improvement_text = last_row_cells[-1].text  # Improvement pill, last column
    if improvement_text.strip() not in ("First attempt",):
        displayed_delta = int(improvement_text.replace("+", "").split()[0])
        assert displayed_delta == (scores_in_play_order[-1] - scores_in_play_order[-2]), (
            f"Improvement shown ({displayed_delta}) doesn't match actual consecutive delta "
            f"({scores_in_play_order[-1] - scores_in_play_order[-2]})"
        )