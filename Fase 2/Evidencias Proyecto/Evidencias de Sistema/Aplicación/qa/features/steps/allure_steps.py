import allure
from allure_commons.types import AttachmentType
from behave import given, when, then

@then('captura "{nombre}"')
@when('captura "{nombre}"')
@given('captura "{nombre}"')
def step_take_named_screenshot(context, nombre):
    png = context.driver.get_screenshot_as_png()
    allure.attach(png, name=nombre, attachment_type=AttachmentType.PNG)
