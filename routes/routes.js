import express from 'express';
import giftCard from '../AppleCode/AppleCode.routes/giftcard.route.js';
import user from '../User/user.router.js';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/gift-card',
    route: giftCard,
  },
   {
    path: '/user',
    route: user,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
