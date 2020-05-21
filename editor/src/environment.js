const getEnv = () => {
	if(!process.env.NODE_ENV || process.env.NODE_ENV === 'development')
		return true;
	return false;
}

module.exports = getEnv;