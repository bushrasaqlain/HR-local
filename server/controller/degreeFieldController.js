const degreeFieldModel = require("../models/degreeFieldModel");


// const degreeFieldModel = require("../models/degreeFieldModel");

const addDegreeField = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

  const { name, t_id, type, data } = req.body;

  if (!t_id) return res.status(400).json({ success: false, error: "Degree type ID is required" });
  if (!name && type !== "csv") return res.status(400).json({ success: false, error: "Degree field name is required" });

  degreeFieldModel.addDegreeField({ name, t_id, type, data, userId }, (err, result) => {
    if (err) return res.status(err.status || 500).json({ success: false, error: err.message });
    res.status(201).json({ success: true, message: "Degree field added successfully", ...result });
  });
};


const editDegreeField = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Name is required",
        });
    }

    degreeFieldModel.editDegreeField(
        id,
        { name },
        userId,
        (err, result) => {
            if (err) {
                return res.status(err.status || 500).json({
                    success: false,
                    message: err.message,
                });
            }

            return res.status(200).json({
                success: true,
                message: result.message,
            });
        }
    );
};



const getAllDegreeFields = (req, res) => {
  const {
    page = 1,
    limit = 15,
    name = "name",
    search = "",
    status = "active",
  } = req.query;
    degreeFieldModel.getAllDegreeFields ({ page, limit, name, search, status },
    (err, data) => {
      if (err) {
        return res.status(500).json({
          error: "Database error",
          details: err.sqlMessage || err.message,
        });
      }
      res.status(200).json(data);
    }
  );
}
const deleteDegreeField = (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    degreeFieldModel.deleteDegreeField(id, userId, (err, result) => {
        if (err) {
            return res.status(err.status || 500).json({
                success: false,
                message: err.message,
            });
        }

        return res.status(200).json({
            success: true,
            ...result,
        });
    });
};


module.exports = {
    addDegreeField,
    editDegreeField,
    getAllDegreeFields,
    deleteDegreeField
};  