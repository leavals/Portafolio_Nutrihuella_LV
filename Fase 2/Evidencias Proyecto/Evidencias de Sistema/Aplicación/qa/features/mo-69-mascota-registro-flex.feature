Feature: Registro de Mascota (flex)

  Background:
    Given estoy autenticado
    When voy a "Mis Mascotas"

  @smoke @flex
  Scenario: Crear mascota exitosamente (flex)
    And hago click (flex) en el botón "Agregar mascota"
    And escribo (flex) "Luna" en el campo "Nombre"
    # El campo permite teclear con el formato mostrado en el placeholder (dd-mm-aaaa)
    And escribo (flex) "10-08-2020" en el campo "Fecha de nacimiento"
    And selecciono (flex) "Perro" en el campo "Especie"
    And selecciono (flex) "Macho" en el campo "Sexo"
    And escribo (flex) "Labrador" en el campo "Raza"
    And selecciono (flex) "Mediano" en el campo "Tamaño"
    And escribo (flex) "15.2" en el campo "Peso (kg)"
    # El CTA puede variar entre "Crear" y "Guardar"
    And hago click (flex) en el botón "Crear|Guardar"
    Then debería ver el texto "Luna"

  @flex
  Scenario: Validaciones obligatorias (flex)
    And hago click (flex) en el botón "Agregar mascota"
    # Sin completar campos obligatorios, el botón no debería habilitarse
    Then el botón "Crear|Guardar" debería estar deshabilitado (flex)
