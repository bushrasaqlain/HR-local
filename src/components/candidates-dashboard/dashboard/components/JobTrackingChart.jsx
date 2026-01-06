"use client"

const PieChart = ({ data }) => {
  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const processedData = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
  }))

  let cumulativePercentage = 0

  const createPath = (percentage, cumulativePercentage) => {
    const startAngle = (cumulativePercentage / 100) * 360
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360

    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)

    const largeArcFlag = percentage > 50 ? 1 : 0

    const x1 = 150 + 120 * Math.cos(startAngleRad)
    const y1 = 150 + 120 * Math.sin(startAngleRad)
    const x2 = 150 + 120 * Math.cos(endAngleRad)
    const y2 = 150 + 120 * Math.sin(endAngleRad)

    return `M 150 150 L ${x1} ${y1} A 120 120 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }

  const getLabelPosition = (percentage, cumulativePercentage) => {
    const midAngle = ((cumulativePercentage + percentage / 2) / 100) * 360
    const midAngleRad = (midAngle - 90) * (Math.PI / 180)
    const labelRadius = 75

    const x = 150 + labelRadius * Math.cos(midAngleRad)
    const y = 150 + labelRadius * Math.sin(midAngleRad)

    return { x, y }
  }

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <svg width="300" height="300" viewBox="0 0 300 300">
        {processedData.map((item, index) => {
          const path = createPath(Number.parseFloat(item.percentage), cumulativePercentage)
          const labelPos = getLabelPosition(Number.parseFloat(item.percentage), cumulativePercentage)
          cumulativePercentage += Number.parseFloat(item.percentage)

          return (
            <g key={item.id || index}>
              <path d={path} fill={item.color} stroke="white" strokeWidth="2" />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
              >
                {item.percentage}%
              </text>
            </g>
          )
        })}
      </svg>

      <div style={{ marginLeft: "32px" }}>
        {processedData.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: item.color,
                marginRight: "8px",
              }}
            />
            <span
              style={{
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function JobTrackingChart({ data = defaultData }) {
  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          padding: "16px 20px 8px 20px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <h6
          style={{
            margin: 0,
            color: "#6c757d",
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
          }}
        >
          MY JOBS SUMMARY
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              border: "2px solid #6c757d",
              marginLeft: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "#6c757d",
              }}
            >
              ?
            </span>
          </div>
        </h6>
      </div>
      <div style={{ padding: "20px" }}>
        <PieChart data={data} />
      </div>
    </div>
  )
}
