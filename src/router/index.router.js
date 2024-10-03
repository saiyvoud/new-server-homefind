import express from "express";
import userController from "../controller/user.controller.js";
import BannerController from "../controller/banner.controller.js";
import { admin, auth } from "../middleware/auth.js";
import PromotionController from "../controller/promotion.controlller.js";
import StatusController from "../controller/status.controller.js";
import KYCController from "../controller/kyc.controller.js";
import CategoryController from "../controller/category.controller.js";
import OrderController from "../controller/order.controller.js";
import PaymentController from "../controller/payment.controller.js";
import ReviewController from "../controller/review.controller.js";
import ServiceController from "../controller/service.controller.js";
import WalletController from "../controller/wallet.controller.js";
const route = express.Router();
//-----------------------banner------------------------------

const bannner = "/banner";
route.get(`${bannner}/selAll`, auth, admin, BannerController.SelAll);
route.get(`${bannner}/selOne/:id`, BannerController.SelOne);
route.get(`${bannner}/selByIsPublice`, BannerController.SelByIsPublice);

route.post(`${bannner}/insert`, BannerController.Insert);

route.put(`${bannner}/update/:id`, BannerController.Update);
route.put(`${bannner}/updateImage/:id`, BannerController.UpdateImage);
route.put(`${bannner}/updateIsPublice`, BannerController.UpdateisPublice);

route.delete(`${bannner}/delete/:id`, BannerController.Delete);

//-----------------------category------------------------------
const category = "/category";

route.get(`${category}/selAll`, CategoryController.SelectAll);
route.get(`${category}/selOne/:id`, CategoryController.SelectOne);

route.post(`${category}/insert`, CategoryController.Insert);

route.put(`${category}/update/:id`, CategoryController.Update);
route.put(`${category}/updateIcon/:id`, CategoryController.UpdateImage);

route.delete(`${category}/delete/:id`, CategoryController.Delete);

route.get(`${category}/search`, CategoryController.Search);

//-----------------------banner------------------------------
const kyc = "/kyc";
route.get(`${kyc}/selAll`, auth, admin, KYCController.SelectAll);
route.get(`${kyc}/selByUserId/:id`, auth, KYCController.SelectByUserId);
route.get(`${kyc}/selOne/:id`, auth, KYCController.SelectOne);

route.post(`${kyc}/insert`, auth, KYCController.Insert);

route.put(`${kyc}/update/:id`, auth, KYCController.Update);
route.put(`${kyc}/updateProfile/:id`, auth, KYCController.UpdateProfile);
route.put(`${kyc}/updateDocImage/:id`, auth, KYCController.UpdateDocImage);

route.delete(`${kyc}/delete/:id`, auth, admin, KYCController.Delete);

//-----------------------order------------------------------
const order = `/order`;

route.get(`${order}/selAll`, auth, admin, OrderController.SelectAll);
route.get(`${order}/selOne/:id`, auth, OrderController.SelectOne);
route.get(`${order}/selByUserId/:userId`, auth, OrderController.SelectByUserId);
route.get(
  `${order}/selByServicesId/:servicesId`,
  auth,
  OrderController.SelectByservicesId
);

route.post(`${order}/insert`, auth, OrderController.Insert);

route.put(`${order}/update/:id`, auth, OrderController.Update);
route.put(`${order}/updateStatus/:id`, auth, OrderController.UpdateStatus);
route.put(`${order}/updateBillQR/:id`, auth, OrderController.UpdateBillQR);

route.delete(`${order}/delete/:id`, auth, OrderController.Delete);

//-----------------------payment------------------------------
const payment = `/payment`;
route.get(`${payment}/selAll`, auth, PaymentController.SelectAll);
route.get(`${payment}/selOne/:id`, auth, PaymentController.SelectOne);
route.get(
  `${payment}/selByIsPublic`,
  auth,
  admin,
  PaymentController.SelectByIsPublic
);

route.post(`${payment}/insert`, auth, admin, PaymentController.Insert);

route.put(`${payment}/update/:id`, auth, admin, PaymentController.Update);
route.put(
  `${payment}/updateImage/:id`,
  auth,
  admin,
  PaymentController.UpdateImage
);

route.delete(`${payment}/delete/:id`, auth, admin, PaymentController.Delete);

//-----------------------promotion------------------------------
const promotion = `/promotion`;
route.get(`${promotion}/selAll`, auth, PromotionController.SelAll);
route.get(`${promotion}/selOne/:id`, auth, PromotionController.SelOne);
route.get(
  `${promotion}/selByCode/:code`,
  auth,
  PromotionController.SelectByCode
);
route.get(
  `${promotion}/selByIsGiven/:isGiven`,
  auth,
  PromotionController.SelectByIsGiven
);

route.post(`${promotion}/insert`, auth, PromotionController.Insert);

route.put(`${promotion}/update/:id`, auth, PromotionController.Update);

route.delete(`${promotion}/delete/:id`, auth, PromotionController.Delete);

//-----------------------review------------------------------
const review = `/review`;

route.get(`${review}/selAll`, auth, ReviewController.SelectAll);
route.get(`${review}/selOne/:id`, auth, ReviewController.SelectOne);
route.get(`${review}/selByUserId/:id`, auth, ReviewController.SelectByUserId);
route.get(`${review}/selByOrderId/:id`, auth, ReviewController.SelectByOrderId);

route.post(`${review}/insert`, auth, ReviewController.Insert);

route.put(`${review}/update/:id`, auth, ReviewController.Update);

route.delete(`${review}/delete/:id`, auth, ReviewController.Delete);

//-----------------------service------------------------------
const service = `/service`;

route.get(`${service}/selAll`, auth, ServiceController.SelectAll);
route.get(`${service}/selOne/:id`, auth, ServiceController.SelectOne);
route.get(
  `${service}/selByUserId/:userId`,
  auth,
  ServiceController.SelectByUserId
);

route.post(`${service}/insert`, auth, ServiceController.Insert);

route.put(`${service}/update/:id`, auth, ServiceController.Update);
route.put(
  `${service}/updateIsShare/:id`,
  auth,
  ServiceController.UpdateIsShare
);
route.put(
  `${service}/updateCoverImage/:id`,
  auth,
  ServiceController.UpdateCoverImage
);
route.put(`${service}/updateImages/:id`, auth, ServiceController.UpdateImages);

route.delete(`${service}/delete/:id`, auth, ServiceController.Delete);

route.get(
  `${service}/selByCategoryId/:categoryId`,
  auth,
  ServiceController.SelectByCategoryId
);
route.get(`${service}/search`, auth, ServiceController.Search);
route.get(`${service}/searchAddress`, auth, ServiceController.SearchAddress);

route.get(
  `${service}/selByIsShare/:isShare`,
  auth,
  ServiceController.SelectByShare
);
route.get(
  `${service}/searchPriceRange`,
  auth,
  ServiceController.SelectByPriceRange
);
//selct by  category id--
// select by isshared--
//search by name order by created--
//search by v d p --
// search between  price --

//-----------------------status------------------------------
const status = "/status";

route.get(`${status}/selAll`, auth, StatusController.SelectAll);
route.get(`${status}/selOne/:id`, auth, StatusController.SelectOne);

route.post(`${status}/insert`, auth, StatusController.Insert);

route.put(`${status}/update/:id`, auth, StatusController.Update);
route.delete(`${status}/delete/:id`, auth, StatusController.Delete);

//-----------------------user------------------------------
const user = `/user`;

route.get(`${user}/selAll`, auth, admin, userController.SelectAll);
route.get(`${user}/selOne/:id`, userController.SelectOne);
route.get(`${user}/selAllPage`, userController.SelecAllPage);
route.post(`${user}/refreshToken`, userController.RefreshToken);

route.post(`${user}/registor`, userController.Registor);
route.post(`${user}/login`, userController.Login);
route.post(`${user}/loginEmail`, userController.LoginEmail);
route.post(`${user}/loginPhoneNumber`, userController.LoginPhoneNumber);

route.put(`${user}/update/:id`, auth, userController.Update);
route.put(`${user}/updateKYCStatu/:id`, auth, userController.UpdateKYCStatus);
route.put(`${user}/updateImage/:id`, auth, userController.UpdateImage);

route.put(`${user}/changePassword/:id`, auth, userController.ChangePassword);

route.delete(`${user}/delete/:id`, auth, userController.Delete);

//-----------------------wallet------------------------------

const wallet = `/wallet`;

route.get(`${wallet}/selAll`, auth, WalletController.SelectAll);
route.get(`${wallet}/selOne/:id`, auth, WalletController.SelectOne);
route.get(`${wallet}/selByUserId/:id`, auth, WalletController.SelectByUserId);

route.post(`${wallet}/insert`, auth, WalletController.Insert);

route.put(`${wallet}/update/:id`, auth, WalletController.Update);

route.delete(`${wallet}/delete/:id`, auth, WalletController.Delete);

export default route;
