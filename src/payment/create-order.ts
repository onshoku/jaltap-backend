import Razorpay from "razorpay";
import crypto from 'crypto';
import { Request, Response } from "express";
import dotenv from "dotenv";

// Initialize Razorpay instance with your Test API credentials
const razorpay = new Razorpay({
  key_id: process.env.RZP_ID,          // Replace with your Razorpay test key
  key_secret: process.env.RZP_SECRET   // Replace with your Razorpay test secret
});
const key_secret = process.env.RZP_SECRET!;

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const { amount } = req.body;

  const options = {
    amount: amount, // amount in paise (e.g., 50000 = ₹500)
    currency: "INR",
    receipt: "order_rcptid_11"
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

export const fetchPaymentDetails = async (req: Request, res: Response): Promise<void> => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Validate signature
  const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // ✅ Print everything for GST/invoicing
    console.log("✅ Full Payment Details:");
    console.log({
      id: payment.id,
      entity: payment.entity,
      amount: payment.amount, // Convert paise to INR
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      captured: payment.captured,
      email: payment.email,
      contact: payment.contact,
      notes: payment.notes,
      fee: payment.fee / 100,
      tax: payment.tax / 100,
      created_at: new Date(payment.created_at * 1000).toLocaleString()
    });

    res.json(payment); // Send to frontend if needed
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
};