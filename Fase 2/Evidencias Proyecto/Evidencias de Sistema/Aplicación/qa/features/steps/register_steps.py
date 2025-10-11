# features/steps/register_steps.py
# -*- coding: utf-8 -*-
from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random, string

# ----------------- helpers -----------------
def _wait(driver, t=15):
    return WebDriverWait(driver, t)

def _tx(s: str) -> str:
    return (s or "").strip().lower()

def _by_label_any(driver, label_text: str):
    """
    Encuentra el control (input/select/textarea/button) asociado a un <label> cuyo
    texto contenga label_text (case-insensitive + acentos).
    Si el label tiene atributo 'for', usa ese ID; si no, usa el siguiente control.
    """
    t = _tx(label_text)
    lbl = driver.find_element(
        By.XPATH,
        f"//label[contains(translate(normalize-space(.),"
        f"'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}')]"
    )
    for_id = lbl.get_attribute("for")
    if for_id:
        return driver.find_element(By.ID, for_id)
    return lbl.find_element(
        By.XPATH,
        "following::*[self::input or self::select or self::textarea or self::button][1]"
    )

def _safe_type(el, text):
    el.clear()
    el.send_keys(text)

def _click_js(driver, el):
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
    driver.execute_script("arguments[0].click();", el)

def _rand_slug(n=6):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

# ----------------- steps: registro -----------------
@given("abro la página de registro")
def step_open_register(context):
    base = context.base_url.rstrip("/")
    context.driver.get(base + "/register")
    # Espera título o botón principal
    _wait(context.driver, 20).until(
        EC.presence_of_element_located((
            By.XPATH,
            "//h1[contains(normalize-space(.),'Regístrate')]"
            " | //button[contains(normalize-space(.),'Crear cuenta')]"
        ))
    )

@given("preparo un email nuevo para registro")
def step_prepare_email(context):
    context.reg_email = f"qa_{_rand_slug()}@example.com"

@given("preparo una contraseña válida para registro")
def step_prepare_password(context):
    # Reglas típicas: >=8, >=2 especiales, >=1 mayúscula, >=1 número
    context.reg_password = "A1@" + _rand_slug(6) + "@#"

@when('escribo el email preparado en el campo "Email"')
def step_type_prepared_email(context):
    inp = _by_label_any(context.driver, "Email")
    _safe_type(inp, context.reg_email)

@when('escribo la contraseña preparada en el campo "Contraseña"')
def step_type_prepared_pwd(context):
    inp = _by_label_any(context.driver, "Contraseña")
    _safe_type(inp, context.reg_password)

@when('escribo la misma contraseña en el campo de confirmación')
def step_type_confirm_same(context):
    conf = _by_label_any(context.driver, "Confirmar contraseña")
    _safe_type(conf, context.reg_password)

@when('escribo "{texto}" en el campo de confirmación')
def step_type_confirm_text(context, texto):
    conf = _by_label_any(context.driver, "Confirmar contraseña")
    _safe_type(conf, texto)

@when('marco los términos y condiciones')
def step_check_terms(context):
    d = context.driver
    # Texto visto: “Acepto los Términos y Condiciones.” (tolerante a acentos/puntuación)
    t = "acepto los términos y condiciones"
    lbl = d.find_element(
        By.XPATH,
        f"//label[contains(translate(normalize-space(.),"
        f"'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}')]"
    )
    for_id = lbl.get_attribute("for")
    cb = d.find_element(By.ID, for_id) if for_id else lbl.find_element(
        By.XPATH,
        "preceding::input[@type='checkbox'][1] | following::input[@type='checkbox'][1]"
    )
    if not cb.is_selected():
        _click_js(d, cb)
    # Espera a que “Crear cuenta” quede habilitado
    _wait(d, 10).until_not(
        EC.element_attribute_to_include(
            (By.XPATH, "//button[contains(normalize-space(.),'Crear cuenta')]"),
            "disabled"
        )
    )

@when('pulso el botón habilitado "Crear cuenta"')
def step_click_enabled_create(context):
    d = context.driver
    btn = _wait(d, 15).until(EC.element_to_be_clickable((
        By.XPATH,
        "//button[contains(normalize-space(.),'Crear cuenta') and not(@disabled)]"
    )))
    try:
        btn.click()
    except Exception:
        _click_js(d, btn)

@then("debería acceder a la aplicación (dashboard o “Mis mascotas”)")
def step_should_be_in_app(context):
    d = context.driver
    # Cualquiera de estos textos indica que ya está dentro
    _wait(d, 25).until(
        EC.presence_of_element_located((
            By.XPATH,
            "//*[contains(translate(.,"  # “Mis mascotas”
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'mis mascotas')]"
            " | "
            "//*[contains(translate(.,"  # “Dashboard”
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'dashboard')]"
        ))
    )

@then("debería ver un mensaje de contraseña no válida")
def step_invalid_password_msg(context):
    d = context.driver
    # Checks rojos/“Fuerza: débil”/mensaje de no válida/no cumple
    _wait(d, 12).until(
        EC.visibility_of_element_located((
            By.XPATH,
            "//*[contains(translate(.," 
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'fuerza: débil')"
            " or contains(translate(.," 
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'contraseña no válida')"
            " or contains(translate(.," 
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'no cumple')]"
        ))
    )
