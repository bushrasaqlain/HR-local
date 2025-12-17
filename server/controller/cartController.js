const cartModel = require("../models/cartModel");


const addCart = (req, res) => {
    cartModel.addCart(req, res);
}
const getCart=(req, res) => {
    cartModel.getCart(req, res);
}


const  getCartCount = (req, res) => {
    cartModel.getCartCount(req, res);
}
const getCartCountbyStatus = (req, res) => {
    cartModel.getCartCountbyStatus(req, res);
}
const getPackagefromCart = (req, res) => {
    cartModel.getPackagefromCart(req, res);
}
const getCartDetails = (req, res) => {
    cartModel.getCartDetails(req, res);
}
const inactiveCartItems = (req, res) => {
    cartModel.inactiveCartItems(req, res);
}
const activeCartItems = (req, res) => {
    cartModel.activeCartItems(req, res);
}
const expiredCartItems = (req, res) => {
    cartModel.expiredCartItems(req, res);
}
const deleteCart = (req, res) => {
    cartModel.deleteCart(req, res);
}
const updateCart = (req, res) => {
    cartModel.updateCart(req, res);
}

module.exports = {
    addCart,
    getCart,
    getCartCount,
    getCartCountbyStatus,
    getPackagefromCart,
    getCartDetails,
    inactiveCartItems,
    activeCartItems,
    expiredCartItems,
    deleteCart,
    updateCart
}