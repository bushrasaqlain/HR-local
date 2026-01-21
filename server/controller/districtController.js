const districtModel= require("../models/districtModel");

const addDistrict=(req,res)=>{
    districtModel.addDistrict(req,res);
}
const editDistrict=(req,res)=>{
    districtModel.editDistrict(req,res);
}   
const getAllDistricts=(req,res)=>{
    districtModel.getAllDistricts(req,res);
}   
const updateStatus=(req,res)=>{
    districtModel.updateStatus(req,res);
}
module.exports={
    addDistrict,
    editDistrict,
    getAllDistricts,
    updateStatus
};