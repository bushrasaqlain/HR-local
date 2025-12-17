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
const deleteDistrict=(req,res)=>{
    districtModel.deleteDistrict(req,res);
}
module.exports={
    addDistrict,
    editDistrict,
    getAllDistricts,
    deleteDistrict
};