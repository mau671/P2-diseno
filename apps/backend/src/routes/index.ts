import { Router } from 'express'
import authRoutes from './auth'
import addressesRoutes from './addresses'
import dietaryRoutes from './dietary'
import cartRoutes from './cart'
import ingredientCategoriesRoutes from './ingredient-categories'
import ingredientsRoutes from './ingredients'
import kitchensRoutes from './kitchens'
import locationsRoutes from './locations'
import mealBasesRoutes from './meal-bases'
import ordersRoutes from './orders'
import paymentMethodsRootRoutes from './payment-methods-root'
import paymentMethodsRoutes from './payment-methods'
import paymentsRoutes from './payments'
import profilesRoutes from './profiles'
import recurringOrdersRootRoutes from './recurring-orders-root'
import recurringOrdersRoutes from './recurring-orders'
import restaurantAdminRoutes from './restaurant-admin'
import restaurantsRoutes from './restaurants'
import savedMealsRoutes from './saved-meals'
import { openapiSpec } from '../openapi'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.get('/openapi.json', (req, res) => {
  res.json(openapiSpec)
})

router.use('/auth', authRoutes)
router.use('/cart', cartRoutes)
router.use('/dietary', dietaryRoutes)
router.use('/ingredient-categories', ingredientCategoriesRoutes)
router.use('/ingredients', ingredientsRoutes)
router.use('/kitchens', kitchensRoutes)
router.use('/locations', locationsRoutes)
router.use('/meal-bases', mealBasesRoutes)
router.use('/orders', ordersRoutes)
router.use('/payment-methods', paymentMethodsRootRoutes)
router.use('/payments', paymentsRoutes)
router.use('/profiles', profilesRoutes)
router.use('/profiles', addressesRoutes)
router.use('/profiles', paymentMethodsRoutes)
router.use('/profiles', recurringOrdersRoutes)
router.use('/recurring-orders', recurringOrdersRootRoutes)
router.use('/restaurants/admin', restaurantAdminRoutes)
router.use('/restaurants', restaurantsRoutes)
router.use('/saved-meals', savedMealsRoutes)

export default router
