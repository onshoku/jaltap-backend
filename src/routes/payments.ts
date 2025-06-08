import { Router } from "express";
import { createOrder, fetchPaymentDetails } from "../payment/create-order";

const router = Router();

router.post('/create-order', createOrder);
router.post('/details',fetchPaymentDetails);
export default router;