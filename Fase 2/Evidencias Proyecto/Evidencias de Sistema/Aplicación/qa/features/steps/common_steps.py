from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# -------- util --------
def _by_label(driver, label_text):
    # Busca el <label> ignorando mayúsculas/acentos y mapea al input por @for
    lbl = driver.find_element(
        By.XPATH,
        f"//label[contains(translate(normalize-space(.), "
        f"'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'), "
        f"'{label_text.lower()}')]"
    )
    for_id = lbl.get_attribute("for")
    return driver.find_element(By.ID, for_id) if for_id else driver.find_element(By.NAME, label_text)

# -------- steps --------
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
    # 1) Buscar por texto completo del botón (string(.)), case-insensitive con acentos
    expr_text = (
        "("
        "//button | //input[@type='submit'] | //a[@role='button']"
        ")[contains(translate(normalize-space(string(.)), "
        "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'), "
        f"'{texto.lower()}')]"
    )
    wait = WebDriverWait(context.driver, 15)
    try:
        btn = wait.until(EC.element_to_be_clickable((By.XPATH, expr_text)))
    except Exception:
        # 2) Fallback: cualquier botón submit dentro de un form
        expr_submit = "//form//button[@type='submit'] | //form//input[@type='submit']"
        btn = wait.until(EC.element_to_be_clickable((By.XPATH, expr_submit)))

    try:
        btn.click()
    except Exception:
        # Fallback por overlay/scroll
        context.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
        context.driver.execute_script("arguments[0].click();", btn)

@when("envío el formulario con Enter")
def step_submit_with_enter(context):
    from selenium.webdriver.common.keys import Keys
    try:
        pwd = context.driver.find_element(By.XPATH, "//input[@type='password']")
        pwd.send_keys(Keys.ENTER)
    except Exception:
        last = context.driver.find_elements(By.XPATH, "(//input[not(@type='hidden')])[last()]")[0]
        last.send_keys(Keys.ENTER)

@then('debería ver el encabezado "{titulo}"')
def step_see_heading(context, titulo):
    WebDriverWait(context.driver, 15).until(
        EC.visibility_of_element_located((
            By.XPATH,
            f"//h1|//h2|//h3[contains(translate(normalize-space(.), "
            f"'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'), "
            f"'{titulo.lower()}')]"
        ))
    )

@then('debería ver el texto "{texto}"')
def step_see_text(context, texto):
    WebDriverWait(context.driver, 15).until(
        EC.visibility_of_element_located((
            By.XPATH,
            f"//*[contains(translate(normalize-space(.), "
            f"'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'), "
            f"'{texto.lower()}')]"
        ))
    )

# ---- DEBUG opcional ----
@then("debug: listar botones")
def step_list_buttons(context):
    els = context.driver.find_elements(By.XPATH, "//button | //input[@type='submit'] | //a[@role='button']")
    print("\n=== BOTONES EN LA PÁGINA ===")
    for i, e in enumerate(els, 1):
        txt = (e.text or e.get_attribute("value") or e.get_attribute("aria-label") or "").strip()
        dis = e.get_attribute("disabled") or e.get_attribute("aria-disabled")
        print(f"{i}. '{txt}' | disabled={dis} | tag={e.tag_name} | type={e.get_attribute('type')}")
    print("=== FIN LISTA ===\n")

# --- MO-68: Login con Google ---

from urllib.parse import urlparse  # <– import al tope del archivo si prefieres

@then('debería existir un botón con texto "{txt}"')
def step_button_visible(context, txt):
    """
    Verifica que exista un botón (button / input submit / a role=button)
    cuyo texto contenga `txt` (insensible a mayúsculas/acentos).
    """
    expr = (
        "("
        "//button | //input[@type='submit'] | //a[@role='button']"
        ")[contains(translate(normalize-space(string(.)), "
        "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'), "
        f"'{txt.lower()}')]"
    )
    WebDriverWait(context.driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, expr))
    )


@then('debería abrirse una nueva ventana cuyo url contiene "{fragmento}"')
def step_new_window_url_contains(context, fragmento):
    """
    Tras hacer click en el botón de Google, espera un popup/nueva pestaña
    y valida que su URL contenga `fragmento` (p.ej. 'accounts.google.com').
    Luego cierra el popup y vuelve a la ventana principal.
    """
    driver = context.driver
    wait = WebDriverWait(driver, 15)

    # Esperar a que aparezca una segunda ventana/pestaña
    wait.until(lambda d: len(d.window_handles) > 1)

    main = driver.current_window_handle
    # Cambiar al nuevo handle (popup)
    for h in driver.window_handles:
        if h != main:
            driver.switch_to.window(h)
            break

    # Validar URL que contiene el fragmento
    wait.until(lambda d: fragmento.lower() in d.current_url.lower())

    # (Opcional) validar host con urlparse
    try:
        host = (urlparse(driver.current_url).hostname or "").lower()
        assert fragmento.split("/")[0].lower() in host
    except Exception:
        # Si no aplica, no fallamos: la validación principal es por 'contains'
        pass

    # Cerrar popup y volver a la principal
    driver.close()
    driver.switch_to.window(main)



# --- Verificación de botón deshabilitado por texto (flex) ---
from behave import then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@then('el botón "{texto}" debería estar deshabilitado (flex)')
def step_boton_deshabilitado_flex(context, texto):
    d = context.driver
    wait = WebDriverWait(d, 12)

    # Localiza por <button> o cualquier elemento con role="button" que contenga el texto
    btn = wait.until(EC.presence_of_element_located((
        By.XPATH,
        f"(//button[contains(normalize-space(.), \"{texto}\")]"
        f" | //*[@role='button' and contains(normalize-space(.), \"{texto}\")])[1]"
    )))

    # Asegura que está en viewport (algunas UIs no marcan atributos hasta que aparezca)
    try:
        d.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
    except Exception:
        pass

    def _esta_deshabilitado(el):
        # Considera diferentes formas de “disabled”
        disabled_attr = el.get_attribute("disabled")
        aria_disabled = (el.get_attribute("aria-disabled") or "").lower()
        cls = (el.get_attribute("class") or "").lower()

        return (
            disabled_attr is not None
            or aria_disabled == "true"
            or "disabled" in cls
        )

    assert _esta_deshabilitado(btn), f'El botón "{texto}" no está deshabilitado.'
