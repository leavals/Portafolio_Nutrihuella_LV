Feature: Registro de usuario
  Como visitante quiero crear una cuenta para usar NutriHuella

  @smoke @register
  Scenario: Registro exitoso con datos válidos
    Given abro la página de registro
    And preparo un email nuevo para registro
    And preparo una contraseña válida para registro
    When escribo "Gonzalo QA" en el campo "Nombre"
    And escribo el email preparado en el campo "Email"
    And escribo la contraseña preparada en el campo "Contraseña"
    And escribo la misma contraseña en el campo de confirmación
    And marco los términos y condiciones
    And pulso el botón habilitado "Crear cuenta"
    Then debería acceder a la aplicación (dashboard o “Mis mascotas”)

  @register @validation
  Scenario: Reglas de contraseña visibles cuando no cumple
    Given abro la página de registro
    And preparo un email nuevo para registro
    When escribo "Gonzalo QA" en el campo "Nombre"
    And escribo "abc123" en el campo "Contraseña"
    And escribo "abc123" en el campo de confirmación
    Then debería ver un mensaje de contraseña no válida
