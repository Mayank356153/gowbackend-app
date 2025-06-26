const express=require("express")


const router=express.Router()


const{createOrder,getAllOrders,getOrderById,updateOrderStatus,getOrdersByStatus,deleteById,assignDeliveryAgent,giveRating}=require("../controllers/OrderController")
 

const{hasPermission,authMiddleware}=require("../middleware/authMiddleware")

router.post("/create",authMiddleware,hasPermission("order","Add"),createOrder)

router.get("/all",authMiddleware,hasPermission("order","View"),getAllOrders)


router.get("/:id",authMiddleware,hasPermission("order","View"),getOrderById)

router.put("/:id",authMiddleware,hasPermission("order","Edit"),updateOrderStatus)

router.get("/status/:status",authMiddleware,hasPermission("order","View"),getOrdersByStatus)


router.delete("/:id",authMiddleware,hasPermission("order","Delete"),deleteById)



router.put("/assign-order/:id",authMiddleware,hasPermission("order","Edit"),assignDeliveryAgent)


router.put("/rating/:orderid",giveRating)







module.exports=router