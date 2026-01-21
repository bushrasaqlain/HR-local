import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addDestination } from "../../../features/filter/employerFilterSlice";

const MIN = 0;
const MAX = 100;

const DestinationRangeSlider = () => {
  const sliderRef = useRef(null);
  const dispatch = useDispatch();

  const { destination } = useSelector(
    (state) => state.employerFilter
  );

  const [minVal, setMinVal] = useState(destination.min);
  const [maxVal, setMaxVal] = useState(destination.max);

  useEffect(() => {
    dispatch(addDestination({ min: minVal, max: maxVal }));
  }, [minVal, maxVal]);

  const getPercent = (value) =>
    ((value - MIN) / (MAX - MIN)) * 100;

  const handleMinChange = (e) => {
    const value = Math.min(+e.target.value, maxVal - 1);
    setMinVal(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(+e.target.value, minVal + 1);
    setMaxVal(value);
  };

  return (
    <div className="range-slider-one">
      <div className="slider-container">
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={minVal}
          onChange={handleMinChange}
          className="thumb thumb-left"
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={maxVal}
          onChange={handleMaxChange}
          className="thumb thumb-right"
        />

        <div className="slider">
          <div
            className="slider__track"
          />
          <div
            className="slider__range"
            style={{
              left: `${getPercent(minVal)}%`,
              right: `${100 - getPercent(maxVal)}%`,
            }}
          />
        </div>
      </div>

      <div className="input-outer">
        <div className="amount-outer">
          <span className="area-amount">{maxVal}</span> km
        </div>
      </div>
    </div>
  );
};

export default DestinationRangeSlider;
