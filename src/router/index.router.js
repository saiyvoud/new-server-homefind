import express from "express";
import userController from "../controller/user.controller.js";
import BannerController from "../controller/banner.controller.js";
import { admin, auth } from "../middleware/auth.js";
import PromotionController from "../controller/promotion.controlller.js";
import StatusController from "../controller/status.controller.js";
import KYCController from "../controller/kyc.controller.js";
const route = express.Router();

const user = `/user`;
route.get(`${user}/selAll`, auth, admin, userController.SelectAll);
route.get(`${user}/selOne/:id`, userController.SelectOne);
route.get(`${user}/selAllPage`, userController.SelecAllPage);
route.post(`${user}/refreshToken`, userController.RefreshToken);

route.post(`${user}/registor`, userController.Registor);
route.post(`${user}/login`, userController.Login);

route.put(`${user}/update/:id`, userController.Update);
route.put(`${user}/updateKYCStatu/:id`, userController.UpdateKYCStatus);
route.put(`${user}/updateImage/:id`, userController.UpdateImage);

route.put(`${user}/changePassword/:id`, userController.ChangePassword);

route.delete(`${user}/delete/:id`, userController.Delete);

const bannner = "/banner";
route.get(`${bannner}/selAll`, auth, admin, BannerController.SelAll);
route.get(`${bannner}/selOne/:id`, BannerController.SelOne);
route.get(`${bannner}/selByIsPublice`, BannerController.SelByIsPublice);

route.post(`${bannner}/insert`, BannerController.Insert);

route.put(`${bannner}/update/:id`, BannerController.Update);
route.put(`${bannner}/updateImage/:id`, BannerController.UpdateImage);
route.put(`${bannner}/updateIsPublice`, BannerController.UpdateisPublice);

route.delete(`${bannner}/delete/:id`, BannerController.Delete);

const promotion = `/promotion`;
route.get(`${promotion}/selAll`, PromotionController.SelAll);
route.get(`${promotion}/selOne/:id`, PromotionController.SelOne);
route.get(`${promotion}/selByCode/:code`, PromotionController.SelectByCode);

route.post(`${promotion}/insert`, PromotionController.Insert);

route.put(`${promotion}/update/:id`, PromotionController.Update);

route.delete(`${promotion}/delete/:id`, PromotionController.Delete);

const status = "/status";

route.get(`${status}/selAll`, StatusController.SelectAll);
route.get(`${status}/selOne/:id`, StatusController.SelectOne);

route.post(`${status}/insert`, StatusController.Insert);

route.put(`${status}/update/:id`, StatusController.Update);
route.delete(`${status}/delete/:id`, StatusController.Delete);

const kyc = "/kyc";
route.get(`${kyc}/selAll`, KYCController.SelectAll);
route.get(`${kyc}/selOne/:id`, KYCController.SelectOne);

route.post(`${kyc}/insert`, KYCController.Insert);

route.put(`${kyc}/update/:id`, KYCController.Update);
route.put(`${kyc}/updateProfile/:id`, KYCController.UpdateProfile);
route.put(`${kyc}/updateDocImage/:id`, KYCController.UpdateDocImage);

route.delete(`${kyc}/delete/:id`, KYCController.Delete);

export default route;
