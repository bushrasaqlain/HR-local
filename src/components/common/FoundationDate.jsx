import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addFoundationDate } from "../../../features/filter/employerFilterSlice";

const MIN_YEAR = 1900;
const MAX_YEAR = 2028;

const FoundationDate = () => {
  const dispatch = useDispatch();
  const { foundationDate: foundationDateFromStore } =
    useSelector((state) => state.employerFilter) || {};

  const [minVal, setMinVal] = useState(foundationDateFromStore?.min || MIN_YEAR);
  const [maxVal, setMaxVal] = useState(foundationDateFromStore?.max || MAX_YEAR);

  // Update Redux store whenever values change
  useEffect(() => {
    dispatch(addFoundationDate({ min: minVal, max: maxVal }));
  }, [minVal, maxVal, dispatch]);

  const getPercent = (value) => ((value - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  const handleMinChange = (e) => {
    const value = Math.min(+e.target.value, maxVal - 1);
    setMinVal(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(+e.target.value, minVal + 1);
    setMaxVal(value);
  };

  return (
    <div className="range-slider-one salary-range">
      <div className="slider-container">
        {/* Range Inputs */}
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={minVal}
          onChange={handleMinChange}
          className="thumb thumb-left"
        />
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={maxVal}
          onChange={handleMaxChange}
          className="thumb thumb-right"
        />

        {/* Slider Track */}
        <div className="slider">
          <div className="slider__track" />
          <div
            className="slider__range"
            style={{
              left: `${getPercent(minVal)}%`,
              right: `${100 - getPercent(maxVal)}%`,
            }}
          />
        </div>
      </div>

      {/* Display Selected Years */}
      <div className="input-outer">
        <div className="amount-outer">
          <span className="d-inline-flex align-items-center">
            <span className="min">{minVal}</span>
            <span className="max ms-2">{maxVal}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FoundationDate;
