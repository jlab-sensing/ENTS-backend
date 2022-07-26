CREATE OR REPLACE FUNCTION get_formatted_power_data(cell_id INT)
RETURNS TABLE (
	ts TIMESTAMP,
	voltage DOUBLE PRECISION,
	current DOUBLE PRECISION,
	power DOUBLE PRECISION
)
LANGUAGE SQL
AS
$$
SELECT
ts,
voltage,
current,
voltage * current AS power
FROM (
	SELECT
	averaged.ts,
	averaged.voltage * 10e-9 AS voltage,
	averaged.current * 10e-6 AS current
	FROM (
		SELECT
		date_trunc('hour', ts) ts,
		AVG(voltage) voltage,
		AVG(current) current
		FROM power_data
		WHERE power_data.cell_id = cell_id
		GROUP BY DATE_TRUNC('hour', ts)
		ORDER BY DATE_TRUNC('hour', ts)
	) averaged
	ORDER BY averaged.ts
) units
ORDER BY ts;
$$
;
