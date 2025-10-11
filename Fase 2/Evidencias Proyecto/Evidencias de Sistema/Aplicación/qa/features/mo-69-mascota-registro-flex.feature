Feature: Registro de Mascota (flex) 

  Background:
    Given estoy autenticado

  @smoke @flex
  Scenario: Crear mascota exitosamente (flex)
    When voy directo a la ruta "/pets"
    And hago click (flex) en el botón "Agregar mascota"
    And escribo (flex) "Luna" en el campo "Nombre"
    And selecciono (flex) "Perro" en el campo "Especie"
    And selecciono (flex) "Macho" en el campo "Sexo"
    And escribo (flex) "Labrador" en el campo "Raza"
    # Si tu modal tiene "Tamaño", descomenta la siguiente línea:
    # And selecciono (flex) "Mediano" en el campo "Tamaño"
    And escribo (flex) "15.2" en el campo "Peso (kg)"
    And hago click (flex) en el botón "Crear"
    Then debería ver el texto "Luna"

  @flex
  Scenario: Validaciones obligatorias (flex)
    When voy directo a la ruta "/pets"
    And hago click (flex) en el botón "Agregar mascota"
    Then el botón "Crear" debería estar deshabilitado (flex)
