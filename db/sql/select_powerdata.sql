SELECT
	timestamp,
	voltage,
	current,
	voltage * current AS power
FROM (
	SELECT
		averaged.timestamp,
		averaged.voltage * 10e-9 AS voltage,
		averaged.current * 10e-6 AS current
	FROM (
		SELECT
			date_trunc('minute', timestamp) timestamp,
			AVG(voltage) voltage,
			AVG(current) current
		FROM power_data
		GROUP BY DATE_TRUNC('minute', timestamp)
		ORDER BY DATE_TRUNC('minute', timestamp)
	) averaged
	ORDER BY averaged.timestamp
) units
ORDER BY timestamp
;
