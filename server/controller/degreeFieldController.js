const degreeFieldModel = require("../models/degreeFieldModel");


// const degreeFieldModel = require("../models/degreeFieldModel");

const addDegreeField = (req, res) => {
    degreeFieldModel.addDegreeField(req, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: "Degree Field added successfully" });
    });
}

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
// Function to fetch dropdown data
const getDegreeFieldsDropdown = (req, res) => {
  const { degree_type_id, search = "", status = "Active" } = req.query;

  if (!degree_type_id) return res.json({ degreefields: [] });

  degreeFieldModel.getDegreeFieldsDropdown(
    {
      degree_type_id: parseInt(degree_type_id),
      search,
      status,
    },
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ degreefields: results });
    }
  );
};

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
    deleteDegreeField,
    getDegreeFieldsDropdown
};  