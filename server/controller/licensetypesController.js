const licensetypesModel= require("../models/licensetypesModel");

const addLicenseType=(req,res)=>{
    licensetypesModel.addLicenseType(req,res);
}
const editLicenseType=(req,res)=>{
    licensetypesModel.editLicenseType(req,res);
}   
const getAllLicenseTypes=(req,res)=>{
    licensetypesModel.getAllLicenseTypes(req,res);
}   
const deleteLicenseType=(req,res)=>{
    licensetypesModel.deleteLicenseType(req,res);
}
module.exports={
    addLicenseType,
    editLicenseType,
    getAllLicenseTypes,
    deleteLicenseType
};