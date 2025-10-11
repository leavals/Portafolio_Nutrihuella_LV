Feature: Inicio de sesión
  Scenario: Login exitoso (smoke)
    Given que abro "/login"
    When escribo "qa.user@example.com" en el campo "Email"
    And escribo "Password!123" en el campo "Contraseña"
    And hago click en el botón "Iniciar sesión"
    Then debería ver el encabezado "Dashboard"