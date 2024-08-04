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

const bannner = "/banner";
route.get(`${bannner}/selAll`, auth, admin, BannerController.SelAll);
route.get(`${bannner}/selOne/:id`, BannerController.SelOne);
route.get(`${bannner}/selByIsPublice`, BannerController.SelByIsPublice);

route.post(`${bannner}/insert`, BannerController.Insert);

route.put(`${bannner}/update/:id`, BannerController.Update);
route.put(`${bannner}/updateImage/:id`, BannerController.UpdateImage);
route.put(`${bannner}/updateIsPublice`, BannerController.UpdateisPublice);

route.delete(`${bannner}/delete/:id`, BannerController.Delete);

const category = "/category";

route.get(`${category}/selAll`, CategoryController.SelectAll);
route.get(`${category}/selOne/:id`, CategoryController.SelectOne);

route.post(`${category}/insert`, CategoryController.Insert);

route.put(`${category}/update/:id`, CategoryController.Update);
route.put(`${category}/updateIcon/:id`, CategoryController.UpdateImage);

route.delete(`${category}/delete/:id`, CategoryController.Delete);

const kyc = "/kyc";
route.get(`${kyc}/selAll`, KYCController.SelectAll);
route.get(`${kyc}/selOne/:id`, KYCController.SelectOne);

route.post(`${kyc}/insert`, KYCController.Insert);

route.put(`${kyc}/update/:id`, KYCController.Update);
route.put(`${kyc}/updateProfile/:id`, KYCController.UpdateProfile);
route.put(`${kyc}/updateDocImage/:id`, KYCController.UpdateDocImage);

route.delete(`${kyc}/delete/:id`, KYCController.Delete);

const order = `/order`;

route.get(`${order}/selAll`, OrderController.SelectAll);
route.get(`${order}/selOne/:id`, OrderController.SelectOne);

route.post(`${order}/insert`, OrderController.Insert);

route.put(`${order}/update/:id`, OrderController.Update);
route.put(`${order}/updateStatus/:id`, OrderController.UpdateStatus);
route.put(`${order}/updateBillQR/:id`, OrderController.UpdateBillQR);

route.delete(`${order}/delete/:id`, OrderController.Delete);

const payment = `/payment`;
route.get(`${payment}/selAll`, PaymentController.SelectAll);
route.get(`${payment}/selOne/:id`, PaymentController.SelectOne);
route.get(`${payment}/selByIsPublic`, PaymentController.SelectByIsPublic);

route.post(`${payment}/insert`, PaymentController.Insert);

route.put(`${payment}/update/:id`, PaymentController.Update);
route.put(`${payment}/updateImage/:id`, PaymentController.UpdateImage);

route.delete(`${payment}/delete/:id`, PaymentController.Delete);

const promotion = `/promotion`;
route.get(`${promotion}/selAll`, PromotionController.SelAll);
route.get(`${promotion}/selOne/:id`, PromotionController.SelOne);
route.get(`${promotion}/selByCode/:code`, PromotionController.SelectByCode);
route.get(`${promotion}/selByIsGiven/:isGiven`, PromotionController.SelectByIsGiven);

route.post(`${promotion}/insert`, PromotionController.Insert);

route.put(`${promotion}/update/:id`, PromotionController.Update);

route.delete(`${promotion}/delete/:id`, PromotionController.Delete);

const review = `/review`;

route.get(`${review}/selAll`, ReviewController.SelectAll);
route.get(`${review}/selOne/:id`, ReviewController.SelectOne);

route.post(`${review}/insert`, ReviewController.Insert);

route.put(`${review}/update/:id`, ReviewController.Update);

route.delete(`${review}/delete/:id`, ReviewController.Delete);

const service = `/service`;

route.get(`${service}/selAll`, ServiceController.SelectAll);
route.get(`${service}/selOne/:id`, ServiceController.SelectOne);

route.post(`${service}/insert`, ServiceController.Insert);

route.put(`${service}/update/:id`, ServiceController.Update);
route.put(`${service}/updateIsShare/:id`, ServiceController.UpdateIsShare);
route.put(`${service}/updateCoverImage/:id`,ServiceController.UpdateCoverImage);
route.put(`${service}/updateImages/:id`, ServiceController.UpdateImages);

route.delete(`${service}/delete/:id`, ServiceController.Delete);

const status = "/status";

route.get(`${status}/selAll`, StatusController.SelectAll);
route.get(`${status}/selOne/:id`, StatusController.SelectOne);

route.post(`${status}/insert`, StatusController.Insert);

route.put(`${status}/update/:id`, StatusController.Update);
route.delete(`${status}/delete/:id`, StatusController.Delete);

const user = `/user`;

route.get(`${user}/selAll`, auth, admin, userController.SelectAll);
route.get(`${user}/selOne/:id`, userController.SelectOne);
route.get(`${user}/selAllPage`, userController.SelecAllPage);
route.post(`${user}/refreshToken`, userController.RefreshToken);

route.post(`${user}/registor`, userController.Registor);
route.post(`${user}/login`, userController.Login);
route.post(`${user}/loginEmail`, userController.LoginEmail);

route.put(`${user}/update/:id`, userController.Update);
route.put(`${user}/updateKYCStatu/:id`, userController.UpdateKYCStatus);
route.put(`${user}/updateImage/:id`, userController.UpdateImage);

route.put(`${user}/changePassword/:id`, userController.ChangePassword);

route.delete(`${user}/delete/:id`, userController.Delete);

const wallet = `/wallet`;

route.get(`${wallet}/selAll`, WalletController.SelectAll);
route.get(`${wallet}/selOne/:id`, WalletController.SelectOne);
route.get(`${wallet}/selByUserId/:id`, WalletController.SelectByUserId);

route.post(`${wallet}/insert`, WalletController.Insert);

route.put(`${wallet}/update/:id`, WalletController.Update);

route.delete(`${wallet}/delete/:id`, WalletController.Delete);

export default route;
