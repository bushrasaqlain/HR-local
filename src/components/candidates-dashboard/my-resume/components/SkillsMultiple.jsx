import CreatableSelect from "react-select/creatable";
import { useState } from "react";

const SkillsMultiple = ({ skills, setSkills }) => {
  const [options, setOptions] = useState([
    { value: "Banking", label: "Banking" },
    { value: "Digital & Creative", label: "Digital & Creative" },
    { value: "Retail", label: "Retail" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Management", label: "Management" },
    { value: "Accounting & Finance", label: "Accounting & Finance" },
    { value: "Digital", label: "Digital" },
    { value: "Creative Art", label: "Creative Art" },
  ]);

  const handleCreate = (inputValue) => {
    const newOption = { value: inputValue, label: inputValue };
    setOptions((prev) => [...prev, newOption]);
    setSkills([...(skills || []), newOption]); // auto-select new skill
  };

  const handleChange = (selected) => {
    setSkills(selected || []);
  };

  return (
    <CreatableSelect
      value={skills}
      isMulti
      name="skills"
      options={options}
      onChange={handleChange}
      onCreateOption={handleCreate}
      className="basic-multi-select"
      classNamePrefix="select"
      placeholder="Select or type a skill..."
    />
  );
};

export default SkillsMultiple;
