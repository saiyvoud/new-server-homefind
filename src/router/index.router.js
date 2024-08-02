import express from "express";
import userController from "../controller/user.controller.js";
import BannerController from "../controller/banner.controller.js";
import { admin, auth } from "../middleware/auth.js";
import PromotionController from "../controller/pormotion.controlller.js";
import StatusController from "../controller/status.controller.js";
const route = express.Router();

const user = `/user`;
route.get(`${user}/selAll`, userController.SelectAll);
route.get(`${user}/selOne/:id`, userController.SelectOne);
route.get(`${user}/selAllPage`, userController.SelecAllPage);

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

export default route;
