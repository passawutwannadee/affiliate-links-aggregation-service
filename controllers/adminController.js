const db = require('../database/db');

const getUserReports = async (req, res) => {
  const status = req.query.status;
  const user_id = req.query.user_id;
  const report_id = req.query.report_id;

  try {
    let getUserReports = db('user_reports')
      .select(
        'report_id',
        'reporter_email',
        'report_information',
        'report_link',
        'report_status'
      )
      .select(
        'username as reported_user',
        'report_category_name as report_category'
      )
      .leftJoin('users', 'user_reports.user_id', 'users.user_id')
      .leftJoin(
        'report_categories',
        'user_reports.report_category_id',
        'report_categories.report_category_id'
      );

    if (status) {
      getUserReports = getUserReports.where('report_status', status);
    }

    if (user_id) {
      getUserReports = getUserReports.where('user_id', user_id);
    }

    if (report_id) {
      getUserReports = getUserReports.where('report_id', report_id);
    }

    const result = await getUserReports;

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

module.exports = {
  getUserReports,
};
