# features/environment.py
import os
import datetime as dt

from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

import allure
from allure_commons.types import AttachmentType


# ---------------- Selenium setup ----------------
def before_all(context):
    opts = Options()
    # opts.add_argument("--headless=new")   # si no quieres ver el navegador
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1366,768")

    service = Service(ChromeDriverManager().install())
    context.driver = Chrome(service=service, options=opts)
    context.driver.implicitly_wait(5)

    context.base_url = os.getenv("BASE_URL", "http://localhost:3000")

    # Modo de screenshots: failed | step | final
    context.shots_mode = os.getenv("ALLURE_SHOTS", "failed").strip().lower()


def after_all(context):
    if getattr(context, "driver", None):
        context.driver.quit()


# ---------------- Helpers ----------------
def _attach_screenshot(context, name: str):
    """Adjunta captura PNG a Allure sin escribir a disco."""
    drv = getattr(context, "driver", None)
    if not drv:
        return
    try:
        png = drv.get_screenshot_as_png()
        allure.attach(png, name=name, attachment_type=AttachmentType.PNG)
    except Exception:
        pass


# ---------------- Hooks Behave ----------------
def before_step(context, step):
    # Si queremos evidencia de cada step (antes o después da igual; uso después para ver el resultado final).
    pass


def after_step(context, step):
    ts = dt.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    safe_step = f"{step.keyword} {step.name}".replace('"', "'")

    # Siempre si falla
    if step.status == "failed":
        _attach_screenshot(context, f"FAILED_{safe_step}_{ts}")
        return

    # Si pidieron evidencia por step aunque pase
    if getattr(context, "shots_mode", "failed") == "step":
        _attach_screenshot(context, f"STEP_{safe_step}_{ts}")


def after_scenario(context, scenario):
    # Evidencia final del escenario si se pidió "final" o si falló todo el escenario
    ts = dt.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    if scenario.status == "failed":
        _attach_screenshot(context, f"SCENARIO_FAILED_{scenario.name}_{ts}")
    elif getattr(context, "shots_mode", "failed") == "final":
        _attach_screenshot(context, f"SCENARIO_{scenario.name}_{ts}")
