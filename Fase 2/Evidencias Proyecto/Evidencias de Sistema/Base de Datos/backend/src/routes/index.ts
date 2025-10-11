import { Router } from 'express'

// ðŸ”¹ Importa las rutas existentes
import authRoutes from './auth.routes.ts'

// âš ï¸ IMPORTANTE:
// Si ya tienes o vas a crear otros mÃ³dulos (mascotas, recetas, despensa),
// dÃ©jalos listos para registrar aquÃ­:
import petsRoutes from './pets.routes.ts'
import pantryRoutes from './pantry.routes.ts'
import recipesRoutes from './recipes.routes.ts'

// ðŸ”¹ Crea el router principal
const router = Router()

// ðŸ”¹ Registra cada grupo de rutas bajo su prefijo
router.use('/auth', authRoutes)
router.use('/pets', petsRoutes)
router.use('/pantry', pantryRoutes)
router.use('/recipes', recipesRoutes)

export default router

