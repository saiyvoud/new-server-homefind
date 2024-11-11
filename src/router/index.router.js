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
import SaleServiceController from "../controller/sale_service.controller.js";
import OtherServiceController from "../controller/other_service.controller.js";
import productOtherServiceController from "../controller/product_other_service.js";
const route = express.Router();
//-----------------------banner------------------------------

const bannner = "/banner";
route.get(`${bannner}/selAll`, BannerController.SelAll);
route.get(`${bannner}/selOne/:id`, BannerController.SelOne);
route.get(`${bannner}/selByIsPublice`, BannerController.SelByIsPublice);

route.post(`${bannner}/insert`, auth, admin, BannerController.Insert);

route.put(`${bannner}/update/:id`, auth, admin, BannerController.Update);
route.put(
  `${bannner}/updateImage/:id`,
  auth,
  admin,
  BannerController.UpdateImage
);
route.put(
  `${bannner}/updateIsPublice/:id`,
  auth,
  admin,
  BannerController.UpdateisPublice
);

route.delete(`${bannner}/delete/:id`, auth, admin, BannerController.Delete);

//-----------------------category------------------------------
const category = "/category";

route.get(`${category}/selAll`, CategoryController.SelectAll);
route.get(`${category}/selShowHome`, CategoryController.SelectShowHome);
route.get(`${category}/selOne/:id`, auth, CategoryController.SelectOne);

route.post(`${category}/insert`, auth, admin, CategoryController.Insert);

route.put(`${category}/update/:id`, auth, admin, CategoryController.Update);
route.put(
  `${category}/updateIcon/:id`,
  auth,
  admin,
  CategoryController.UpdateImage
);

route.delete(`${category}/delete/:id`, auth, admin, CategoryController.Delete);

route.get(`${category}/search`, auth, admin, CategoryController.Search);

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

route.get(`${order}/selAll`, auth, OrderController.SelectAll);
route.get(`${order}/selOne/:id`, auth, OrderController.SelectOne);
route.get(`${order}/selByUserId/:userId`, auth, OrderController.SelectByUserId);
route.get(
  `${order}/selByPosterId/:posterId`,
  auth,
  OrderController.SelectByPosterId
);
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
route.get(`${payment}/selAll`, PaymentController.SelectAll);
route.get(`${payment}/selOne/:id`, PaymentController.SelectOne);
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
route.get(`${promotion}/selAll`, PromotionController.SelAll);
route.get(`${promotion}/selOne/:id`, PromotionController.SelOne);
route.get(`${promotion}/selByCode/:code`, PromotionController.SelectByCode);
route.get(
  `${promotion}/selByIsGiven/:isGiven`,
  PromotionController.SelectByIsGiven
);

route.post(`${promotion}/insert`, auth, admin, PromotionController.Insert);

route.put(`${promotion}/update/:id`, auth, PromotionController.Update);

route.delete(
  `${promotion}/delete/:id`,
  auth,
  admin,
  PromotionController.Delete
);

//-----------------------review------------------------------
const review = `/review`;

route.get(`${review}/selAll`, auth, ReviewController.SelectAll);
route.get(`${review}/selOne/:id`, auth, ReviewController.SelectOne);
route.get(`${review}/selByUserId/:id`, auth, ReviewController.SelectByUserId);
route.get(`${review}/selByOrderId/:id`, auth, ReviewController.SelectByOrderId);

route.post(`${review}/insert`, auth, ReviewController.Insert);

route.put(`${review}/update/:id`, auth, admin, ReviewController.Update);

route.delete(`${review}/delete/:id`, auth, admin, ReviewController.Delete);

//-----------------------service------------------------------
const service = `/service`;

route.get(`${service}/selAll`, ServiceController.SelectAll);
route.get(`${service}/selOne/:id`, ServiceController.SelectOne);
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
  `${service}/updateStatusId/:id`,
  auth,
  ServiceController.UpdateStatusId
);
route.put(
  `${service}/updateCoverImage/:id`,
  auth,
  ServiceController.UpdateCoverImage
);
route.put(`${service}/updateImages/:id`, auth, ServiceController.UpdateImages);
route.put(`${service}/updateView/:id`, ServiceController.UpdateView);

route.delete(`${service}/delete/:id`, auth, ServiceController.Delete);

route.get(
  `${service}/selByCategoryId/:categoryId`,
  auth,
  ServiceController.SelectByCategoryId
);
route.get(
  `${service}/selCategoryShowHome`,
  auth,
  ServiceController.SelectCategoryShowHome
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

//-----------------------saleservice------------------------------
const saleService = `/saleService`;

route.get(`${saleService}/selAll`, SaleServiceController.SelectAll);
route.get(`${saleService}/selOne/:id`, SaleServiceController.SelectOne);
route.get(
  `${saleService}/selByUserId/:userId`,
  auth,
  SaleServiceController.SelectByUserId
);

route.post(`${saleService}/insert`, auth, SaleServiceController.Insert);

route.put(`${saleService}/update/:id`, auth, SaleServiceController.Update);

route.put(
  `${saleService}/updateStatusId/:id`,
  auth,
  SaleServiceController.UpdateStatusId
);
route.put(
  `${saleService}/updateCoverImage/:id`,
  auth,
  SaleServiceController.UpdateCoverImage
);
route.put(
  `${saleService}/updateImages/:id`,
  auth,
  SaleServiceController.UpdateImages
);
route.put(`${saleService}/updateView/:id`, SaleServiceController.UpdateView);

route.delete(`${saleService}/delete/:id`, auth, SaleServiceController.Delete);

route.get(
  `${saleService}/selByCategoryId/:categoryId`,
  auth,
  SaleServiceController.SelectByCategoryId
);

route.get(`${saleService}/search`, auth, SaleServiceController.Search);
route.get(
  `${saleService}/selRecommend`,
  auth,
  SaleServiceController.SelectRecommend
);
route.get(
  `${saleService}/searchAddress`,
  auth,
  SaleServiceController.SearchAddress
);

//-----------------------otherservice------------------------------
const otherService = `/otherService`;

route.get(`${otherService}/selAll`, OtherServiceController.SelectAll);
route.get(`${otherService}/selOne/:id`, OtherServiceController.SelectOne);
route.get(
  `${otherService}/selByUserId/:userId`,
  auth,
  OtherServiceController.SelectByUserId
);

route.post(`${otherService}/insert`, auth, OtherServiceController.Insert);

route.put(`${otherService}/update/:id`, auth, OtherServiceController.Update);

route.put(
  `${otherService}/updateCoverImage/:id`,
  auth,
  OtherServiceController.UpdateCoverImage
);
route.put(
  `${otherService}/updateImages/:id`,
  auth,
  OtherServiceController.UpdateImages
);
route.put(`${otherService}/updateView/:id`, OtherServiceController.UpdateView);

route.delete(`${otherService}/delete/:id`, auth, OtherServiceController.Delete);

route.get(
  `${otherService}/selByCategoryId/:categoryId`,
  auth,
  OtherServiceController.SelectByCategoryId
);

route.get(`${otherService}/search`, auth, OtherServiceController.Search);
route.get(
  `${otherService}/selRecommend`,
  auth,
  OtherServiceController.SelectRecommend
);
route.get(
  `${otherService}/searchAddress`,
  auth,
  OtherServiceController.SearchAddress
);

//-----------Product Otherservice------------

const productOtherService = `/productOtherService`;

route.get(
  `${productOtherService}/selAll`,
  productOtherServiceController.SelectAll
);
route.get(
  `${productOtherService}/selOne/:id`,
  productOtherServiceController.SelectOne
);

route.post(
  `${productOtherService}/insert`,
  auth,
  productOtherServiceController.Insert
);

route.put(
  `${productOtherService}/update/:id`,
  auth,
  productOtherServiceController.Update
);

route.put(
  `${productOtherService}/updateCoverImage/:id`,
  auth,
  productOtherServiceController.UpdateCoverImage
);

route.delete(
  `${productOtherService}/delete/:id`,
  auth,
  productOtherServiceController.Delete
);

route.get(
  `${productOtherService}/selByOtherService/:otherId`,
  productOtherServiceController.SelectByOtherServiceId
);

//-----------------------status------------------------------
const status = "/status";

route.get(`${status}/selAll`, auth, StatusController.SelectAll);
route.get(`${status}/selOne/:id`, auth, StatusController.SelectOne);

route.post(`${status}/insert`, auth, admin, StatusController.Insert);

route.put(`${status}/update/:id`, auth, admin, StatusController.Update);
route.delete(`${status}/delete/:id`, auth, admin, StatusController.Delete);

//-----------------------user------------------------------
const user = `/user`;

route.get(`${user}/selAll`, auth, userController.SelectAll);
route.get(`${user}/selOne/:id`, userController.SelectOne);
route.get(`${user}/selAllPage`, userController.SelecAllPage);
route.post(`${user}/refreshToken`, userController.RefreshToken);

route.post(`${user}/registor`, userController.Registor);
route.post(`${user}/login`, userController.Login);
route.post(`${user}/loginEmail`, userController.LoginEmail);
route.post(`${user}/loginPhoneNumber`, userController.LoginPhoneNumber);

route.put(`${user}/update/:id`, auth, userController.Update);
route.put(`${user}/updateKYCStatu/:id`, auth, userController.UpdateKYCStatus);
route.put(`${user}/updateBanStatus/:id`, auth, userController.UpdateBanStatus);
route.put(`${user}/updateImage/:id`, auth, userController.UpdateImage);

route.put(`${user}/changePassword/:id`, auth, userController.ChangePassword);

route.delete(`${user}/delete/:id`, auth, userController.Delete);

route.post(`${user}/SendOTP`, userController.SendOTP);

//-----------------------wallet------------------------------

const wallet = `/wallet`;

route.get(`${wallet}/selAll`, auth, WalletController.SelectAll);
route.get(`${wallet}/selOne/:id`, auth, WalletController.SelectOne);
route.get(`${wallet}/selByUserId/:id`, auth, WalletController.SelectByUserId);

route.post(`${wallet}/insert`, auth, WalletController.Insert);

route.put(`${wallet}/update/:id`, auth, WalletController.Update);

route.delete(`${wallet}/delete/:id`, auth, WalletController.Delete);

export default route;
