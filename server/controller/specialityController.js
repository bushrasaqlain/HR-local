const specialityModel= require("../models/specialityModel");

const addspeciality=(req,res)=>{
    specialityModel.addspeciality(req,res);
}
const editspeciality=(req,res)=>{
    specialityModel.editspeciality(req,res);
}   
const getAllspeciality=(req,res)=>{
    specialityModel.getAllspeciality(req,res);
}   
const deletespeciality=(req,res)=>{
    specialityModel.deletespeciality(req,res);
}
module.exports={
    addspeciality,
    editspeciality,
    getAllspeciality,
    deletespeciality
};