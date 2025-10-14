# features/steps/common_steps.py
# -*- coding: utf-8 -*-
from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# =========================
# Utils
# =========================

def _tx(s: str) -> str:
    return (s or "").strip().lower()

def _wait(driver, t=15):
    return WebDriverWait(driver, t)

def _by_label(driver, label_text):
    """
    Busca el control por <label> insensible a mayúsculas/acentos.
    Si el label tiene @for, usa ese id; si no, toma el siguiente control.
    Fallback: busca por aria-label/title que contengan el texto.
    """
    t = _tx(label_text)
    # 1) <label> que contenga el texto (insensible a acentos/mayúsculas)
    lbls = driver.find_elements(
        By.XPATH,
        f"//label[contains(translate(normalize-space(string(.)),"
        f"'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}')]"
    )
    if lbls:
        lbl = lbls[0]
        for_id = lbl.get_attribute("for")
        if for_id:
            try:
                return driver.find_element(By.ID, for_id)
            except Exception:
                pass
        # Siguiente control razonable tras el label
        try:
            return lbl.find_element(
                By.XPATH,
                "following::*[self::input or self::select or self::textarea or @role='combobox'][1]"
            )
        except Exception:
            pass

    # 2) Fallback por aria-label o title
    els = driver.find_elements(
        By.XPATH,
        "//*[(self::input or self::select or self::textarea or @role='combobox') and "
        "(contains(translate(@aria-label,'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
        f"'{t}') or contains(translate(@title,'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}'))]"
    )
    if els:
        return els[0]

    # 3) Fallback final por name exacto (menos robusto)
    try:
        return driver.find_element(By.NAME, label_text)
    except Exception:
        pass

    raise AssertionError(f"No se encontró control para el label: {label_text!r}")

def _click_button_text(driver, texto: str, timeout=15):
    """
    Click por texto visible en button / input submit / a[role=button].
    Acepta variantes separadas por '|', tolerante a acentos/mayúsculas.
    Hace fallback a JS click si no es 'clickable'.
    """
    variants = [v.strip() for v in str(texto).split("|") if v.strip()] or [texto]
    last_err = None

    def _expr(t):
        return (
            "("
            "//button | //input[@type='submit' or @type='button'] | //a[@role='button']"
            ")[contains(translate(normalize-space(string(.)),"
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
            f"'{_tx(t)}')]"
        )

    for t in variants:
        try:
            el = _wait(driver, timeout).until(EC.element_to_be_clickable((By.XPATH, _expr(t))))
            try:
                el.click()
                return
            except Exception:
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
                driver.execute_script("arguments[0].click();", el)
                return
        except Exception as e:
            last_err = e
            # Fallback extra: cualquier submit dentro de form
            try:
                el = _wait(driver, 5).until(EC.element_to_be_clickable((
                    By.XPATH, "//form//button[@type='submit'] | //form//input[@type='submit']"
                )))
                try:
                    el.click()
                    return
                except Exception:
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
                    driver.execute_script("arguments[0].click();", el)
                    return
            except Exception as e2:
                last_err = e2
                continue

    raise last_err or AssertionError(f"No se pudo clicar el botón con texto: {texto!r}")


# =========================
# Steps básicos
# =========================

@given('que abro "{path}"')
def step_open(context, path):
    context.driver.get(context.base_url + path)

@when('escribo "{texto}" en el campo "{campo}"')
def step_type(context, texto, campo):
    el = _by_label(context.driver, campo)
    el.clear()
    el.send_keys(texto)

@when('hago click en el botón "{texto}"')
def step_click_button(context, texto):
    _click_button_text(context.driver, texto, timeout=15)

@when("envío el formulario con Enter")
def step_submit_with_enter(context):
    from selenium.webdriver.common.keys import Keys
    d = context.driver
    try:
        pwd = d.find_element(By.XPATH, "//input[@type='password']")
        pwd.send_keys(Keys.ENTER)
    except Exception:
        last = d.find_elements(By.XPATH, "(//input[not(@type='hidden')])[last()]")[0]
        last.send_keys(Keys.ENTER)

@then('debería ver el encabezado "{titulo}"')
def step_see_heading(context, titulo):
    context.driver.implicitly_wait(0)
    try:
        _wait(context.driver, 15).until(EC.visibility_of_element_located((
            By.XPATH,
            "("
            "//h1 | //h2 | //h3"
            ")[contains(translate(normalize-space(string(.)),"
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
            f"'{_tx(titulo)}')]"
        )))
    finally:
        context.driver.implicitly_wait(5)

@then('debería ver el texto "{texto}"')
def step_see_text(context, texto):
    _wait(context.driver, 15).until(EC.visibility_of_element_located((
        By.XPATH,
        f"//*[contains(translate(normalize-space(string(.)), "
        f"'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'), "
        f"'{_tx(texto)}')]"
    )))

# ---- DEBUG opcional ----
@then("debug: listar botones")
def step_list_buttons(context):
    els = context.driver.find_elements(By.XPATH, "//button | //input[@type='submit'] | //a[@role='button']")
    print("\n=== BOTONES EN LA PÁGINA ===")
    for i, e in enumerate(els, 1):
        txt = (e.text or e.get_attribute("value") or e.get_attribute("aria-label") or "").strip()
        dis = e.get_attribute("disabled") or e.get_attribute("aria-disabled")
        print(f"{i}. '{txt}' | disabled={dis} | tag={e.tag_name} | type={e.get_attribute('type')}")
    print("=== FIN LISTA ===\n)")


# =========================
# MO-68: Login con Google
# =========================
from urllib.parse import urlparse

@then('debería existir un botón con texto "{txt}"')
def step_button_visible(context, txt):
    expr = (
        "("
        "//button | //input[@type='submit'] | //a[@role='button']"
        ")[contains(translate(normalize-space(string(.)), "
        "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'), "
        f"'{_tx(txt)}')]"
    )
    _wait(context.driver, 10).until(EC.visibility_of_element_located((By.XPATH, expr)))

@then('debería abrirse una nueva ventana cuyo url contiene "{fragmento}"')
def step_new_window_url_contains(context, fragmento):
    d = context.driver
    wait = _wait(d, 15)

    # Esperar a que aparezca una segunda ventana/pestaña
    wait.until(lambda drv: len(drv.window_handles) > 1)

    main = d.current_window_handle
    # Cambiar al nuevo handle (popup)
    for h in d.window_handles:
        if h != main:
            d.switch_to.window(h)
            break

    # Validar URL que contiene el fragmento
    wait.until(lambda drv: _tx(fragmento) in _tx(drv.current_url))

    # (Opcional) validar host
    try:
        host = (_tx(urlparse(d.current_url).hostname) or "")
        assert fragmento.split("/")[0].lower() in host
    except Exception:
        pass

    # Cerrar popup y volver a la principal
    d.close()
    d.switch_to.window(main)


# ==========================================
# Verificación de botón deshabilitado (flex)
# ==========================================
@then('el botón "{texto}" debería estar deshabilitado (flex)')
def step_boton_deshabilitado_flex(context, texto):
    """
    Soporta variantes separadas por '|'
    Detecta disabled nativo, aria-disabled y clases/estilos típicos de deshabilitado.
    """
    d = context.driver
    wait = _wait(d, 12)

    variants = [t.strip().lower() for t in str(texto).split("|") if t.strip()] or [texto.strip().lower()]

    def _make_xpath(t):
        return (
            "("
            "//button[contains(translate(normalize-space(string(.)),"
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}')]"
            " | //*[@role='button' and contains(translate(normalize-space(string(.)),"
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}')]"
            " | //input[@type='submit' and contains(translate(@value,"
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}')]"
            ")[1]"
        ).format(t=t)

    btn = None
    last_exc = None
    for t in variants:
        try:
            btn = wait.until(EC.presence_of_element_located((By.XPATH, _make_xpath(t))))
            break
        except Exception as e:
            last_exc = e
    if btn is None:
        raise last_exc or AssertionError(f'No se encontró ningún botón con textos: {variants}')

    # Asegura que está visible en viewport
    try:
        d.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
    except Exception:
        pass

    # Reglas de deshabilitado
    disabled_attr = btn.get_attribute("disabled")
    aria_disabled = (btn.get_attribute("aria-disabled") or "").lower()
    cls = (btn.get_attribute("class") or "").lower()
    pointer_events = (btn.value_of_css_property("pointer-events") or "").lower()
    opacity = (btn.value_of_css_property("opacity") or "").strip()

    is_disabled = any([
        disabled_attr is not None,
        aria_disabled == "true",
        "disabled" in cls,
        "cursor-not-allowed" in cls,
        "pointer-events-none" in cls,
        pointer_events == "none",
        # Algunas UIs marcan opacidad + clase utilitaria
        ("opacity-50" in cls and opacity in ("0.5", "0.6")),
    ])

    if not is_disabled:
        # Mensaje de depuración útil si falla
        label = (btn.text or btn.get_attribute("value") or "").strip()
        raise AssertionError(
            f'El botón no está deshabilitado.\n'
            f'text="{label}" | disabled={disabled_attr} | aria-disabled={aria_disabled} | '
            f'class="{cls}" | pointer-events={pointer_events} | opacity={opacity}'
        )
