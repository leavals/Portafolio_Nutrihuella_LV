# features/steps/mascota_steps.py
from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import os
import time

# ---- (opcional) Allure: adjuntar screenshot en fallos ----
try:
    import allure
    from allure_commons.types import AttachmentType
    def _attach_if_allure(driver, name="screenshot"):
        try:
            png = driver.get_screenshot_as_png()
            allure.attach(png, name=name, attachment_type=AttachmentType.PNG)
        except Exception:
            pass
except Exception:
    def _attach_if_allure(*_args, **_kwargs):
        pass


# ================== Helpers ==================

def _tx(s: str) -> str:
    """Normaliza a minúsculas con acentos para XPaths case-insensitive."""
    return (s or "").lower()

def _wait(driver, timeout=10):
    return WebDriverWait(driver, timeout)

def _click_text_button(driver, text: str, timeout=15):
    """
    Click por texto visible en button/a/role=button/input.
    Admite variantes separadas por '|', p.e.: "Crear|Guardar".
    Si no está 'clickable', prueba con JS click.
    """
    variants = [t.strip() for t in str(text).split("|") if t.strip()]
    last_err = None
    for t in variants or [""]:
        expr = (
            "("
            "//button | //a | //*[@role='button'] | //input[@type='submit' or @type='button']"
            ")[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
            f"'{_tx(t)}')]"
        )
        try:
            el = _wait(driver, timeout).until(EC.element_to_be_clickable((By.XPATH, expr)))
            el.click()
            return
        except Exception as e:
            last_err = e
            try:
                # Si no fue clickable, intenta presencia + JS click.
                el = _wait(driver, timeout).until(EC.presence_of_element_located((By.XPATH, expr)))
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
                driver.execute_script("arguments[0].click();", el)
                return
            except Exception as e2:
                last_err = e2
                continue
    _attach_if_allure(driver, f"no-se-pudo-click-{text}")
    raise last_err or Exception(f"No se pudo clicar el botón con texto: {text}")

def _by_label_any(driver, label_text: str):
    """
    Encuentra el control asociado a un <label> que contenga label_text (case-insensitive),
    o bien un control cercano con aria-label/title. Devuelve input/select/textarea/combobox.
    """
    t = _tx(label_text)
    # 1) label -> for/id
    label_expr = (
        "//label[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
        f"'{t}')]"
    )
    labels = driver.find_elements(By.XPATH, label_expr)
    if labels:
        lbl = labels[0]
        for_id = lbl.get_attribute("for")
        if for_id:
            return driver.find_element(By.ID, for_id)
        try:
            # Primer control relevante a continuación del label
            return lbl.find_element(
                By.XPATH,
                "following::*[self::input or self::select or self::textarea or @role='combobox'][1]"
            )
        except Exception:
            pass

    # 2) cualquier control con aria-label/title que contenga el texto
    aria_expr = (
        "//*[(self::input or self::select or self::textarea or @role='combobox') and "
        "(contains(translate(@aria-label,'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
        f"'{t}') or contains(translate(@title,'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'{t}'))]"
    )
    els = driver.find_elements(By.XPATH, aria_expr)
    if els:
        return els[0]

    # 3) fallback: primer input/select/textarea visible que siga a un nodo que contenga ese texto
    near_expr = (
        "("
        "//*[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
        f"'{t}')]"
        ")/following::input[1] | "
        "("
        "//*[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
        f"'{t}')]"
        ")/following::select[1] | "
        "("
        "//*[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
        f"'{t}')]"
        ")/following::textarea[1]"
    )
    return driver.find_element(By.XPATH, near_expr)

def _fill_input_like(el, value):
    el.clear()
    el.send_keys(value)

def _select_option(el, visible_text, driver):
    """Selecciona en <select> o en un combo ARIA (role=combobox)."""
    tag = (el.tag_name or "").lower()
    role = (el.get_attribute("role") or "").lower()
    if tag == "select":
        Select(el).select_by_visible_text(visible_text)
        return
    if role == "combobox":
        el.click()
        opt = _wait(driver, 10).until(EC.element_to_be_clickable((
            By.XPATH,
            "//*[@role='listbox']//*[@role='option'][contains(translate(normalize-space(string(.)),"
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),"
            f"'{_tx(visible_text)}')]"
        )))
        opt.click()
        return
    # fallback: click normal
    el.click()

def _wait_logged_any(driver, timeout=20):
    """
    Consideramos 'logueado' si aparece algo de la navegación privada
    o un destino común post-login (Dashboard/Mis mascotas).
    """
    x = (
        "("
        # enlace o botón de 'Mis mascotas'
        "//a|//button|//*[@role='link' or @role='button']"
        ")[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'mis mascotas')]"
        " | "
        # botón 'Agregar mascota'
        "("
        "//button|//*[@role='button']"
        ")[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'agregar mascota')]"
        " | "
        # encabezado de Mis mascotas
        "//*[self::h1 or self::h2 or self::h3][contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'mis mascotas')]"
    )
    _wait(driver, timeout).until(EC.presence_of_element_located((By.XPATH, x)))

def _wait_pets_landed(driver, timeout=20):
    """
    Ya en /pets, espera un indicio claro: botón 'Agregar mascota' o título 'Mis mascotas'
    """
    expr = (
        "("
        "//button|//*[@role='button']"
        ")[contains(translate(normalize-space(string(.)),'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'agregar mascota')]"
        " | "
        "//*[self::h1 or self::h2 or self::h3][contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'mis mascotas')]"
    )
    _wait(driver, timeout).until(EC.presence_of_element_located((By.XPATH, expr)))


# ================== Steps ==================

@given("estoy autenticado")
def step_estoy_autenticado(context):
    """
    Hace login con QA_EMAIL y QA_PASSWORD.
    Si hay modal de "Acceso no autorizado", pulsa "Iniciar sesión".
    Luego intenta aterrizar en /pets (Mis mascotas).
    """
    email = os.getenv("QA_EMAIL", "qa.user@example.com")
    password = os.getenv("QA_PASSWORD", "Password!123")
    base = (context.base_url or "").rstrip("/")

    driver = context.driver

    # Ir a /pets; si sale modal "Acceso no autorizado", pulsar "Iniciar sesión".
    driver.get(base + "/pets")
    try:
        _click_text_button(driver, "Iniciar sesión", timeout=5)
    except Exception:
        # Puede que ya estemos en /login por redirects, o logueados.
        pass

    # Si no estamos en /login, vamos explícitamente.
    if not driver.current_url.endswith("/login"):
        driver.get(base + "/login")

    # Completar formulario
    inp_email = _by_label_any(driver, "Email")
    _fill_input_like(inp_email, email)

    inp_pwd = _by_label_any(driver, "Contraseña")
    _fill_input_like(inp_pwd, password)

    _click_text_button(driver, "Entrar|Iniciar sesión", timeout=10)

    # Espera a estar logueado (algún rastro de navegación privada)
    try:
        _wait_logged_any(driver, timeout=25)
    except TimeoutException:
        _attach_if_allure(driver, "login-no-detectado")
        raise

    # Ir a Mis mascotas de forma estable
    try:
        _click_text_button(driver, "Mis mascotas", timeout=6)
    except Exception:
        # Si no hay entrada en el menú, navega directo
        driver.get(base + "/pets")

    # Confirmar que /pets ya cargó
    _wait_pets_landed(driver, timeout=25)


@when('voy directo a la ruta "{path}"')
def step_go_direct(context, path):
    base = (context.base_url or "").rstrip("/")
    context.driver.get(base + path)

@when('voy a "{menu}"')
def step_voy_a_menu(context, menu):
    _click_text_button(context.driver, menu, timeout=15)

@when('hago click (flex) en el botón "Agregar mascota"')
def step_open_add_pet_modal(context):
    """
    Abre el modal y espera a que esté listo (título o label 'Nombre').
    """
    _click_text_button(context.driver, "Agregar mascota", timeout=20)
    try:
        _wait(context.driver, 10).until(EC.presence_of_element_located((
            By.XPATH,
            "//*[self::h1 or self::h2 or self::h3][contains(translate(.,"
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'agregar mascota')]"
            " | //label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜ','abcdefghijklmnopqrstuvwxyzáéíóúü'),'nombre')]"
        )))
    except TimeoutException:
        _attach_if_allure(context.driver, "modal-agregar-mascota-no-abrio")
        raise

@when('hago click (flex) en el botón "{texto}"')
def step_click_flex(context, texto):
    _click_text_button(context.driver, texto, timeout=20)

@when('escribo (flex) "{valor}" en el campo "{label}"')
def step_escribo_flex(context, valor, label):
    el = _by_label_any(context.driver, label)
    _fill_input_like(el, valor)

@when('selecciono (flex) "{opcion}" en el campo "{label}"')
def step_selecciono_flex(context, opcion, label):
    el = _by_label_any(context.driver, label)
    _select_option(el, opcion, context.driver)
