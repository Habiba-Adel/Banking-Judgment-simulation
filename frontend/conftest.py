from selenium.webdriver.common.by import By


def pytest_runtest_makereport(item, call):
    """On any test failure, dump the current URL + visible body text so a
    timeout tells us WHERE the app actually got stuck, not just that it did.
    Must live in conftest.py — pytest only collects hookimpls from here (or
    a plugin), not from a plain test_*.py module.
    """
    if call.when == "call" and call.excinfo is not None:
        drv = item.funcargs.get("driver")
        if drv is not None:
            try:
                print(f"\n--- FAILURE DIAGNOSTICS ({item.name}) ---")
                print(f"current_url: {drv.current_url}")
                body_text = drv.find_element(By.TAG_NAME, "body").text
                print(f"visible body text (first 2000 chars):\n{body_text[:2000]}")
            except Exception as diag_err:
                print(f"(failed to collect diagnostics: {diag_err})")
            try:
                api_log = drv.execute_script("return window.__apiLog || null;")
                if api_log:
                    print(f"\napi log ({len(api_log)} requests captured):")
                    for entry in api_log:
                        print(
                            f"  {entry.get('method')} {entry.get('url')} -> {entry.get('status')}"
                        )
                        if entry.get("reqBody"):
                            print(f"    req: {entry.get('reqBody')}")
                        if "/current-step" in entry.get("url", "") or entry.get("status", 200) >= 400:
                            print(f"    res: {entry.get('resBody')}")
                else:
                    print("(no window.__apiLog present — fetch logger wasn't installed yet)")
            except Exception as api_err:
                print(f"(failed to collect api log: {api_err})")
            try:
                dom_state = drv.execute_script("""
                    const send = document.querySelector("[data-testid='send-button']");
                    const choices = Array.from(document.querySelectorAll("[data-testid='choice-button']"));
                    const contacts = Array.from(document.querySelectorAll("[data-testid='contact-item']"));
                    return {
                        sendDisabled: send ? send.disabled : null,
                        sendClass: send ? send.className : null,
                        choices: choices.map(c => ({
                            id: c.getAttribute("data-choice-id"),
                            className: c.className,
                        })),
                        contacts: contacts.map(c => ({
                            id: c.getAttribute("data-character-id"),
                            unread: c.getAttribute("data-unread"),
                        })),
                    };
                """)
                print(f"\ndom state at failure:\n{dom_state}")
            except Exception as dom_err:
                print(f"(failed to collect dom state: {dom_err})")
            print("--- end diagnostics ---\n")