/**
 * update grades from google spreadsheet to google classroom: 
 * it does not include doGet, doPost...
 * it is written for personal use to just upload grades of my courses, it may include a few bugs:
 * after setting up the data below, 
 * run uploadGradesToClassroom();
 * adaskin,2024
 */
data = {
  'course': '.....',
  'assignment': '...',
  'range': 'A1:B100', //active spreadheet range
  'createAssignment': false,
  'returnGrades': false,
  'uploadThroughSidear': false
};

/**
 * data = '{
      'course':'courseTitle',
      'assignment': 'assignmentTitle',
      'range':'A1:B100',
      'createAssignment': false,
      'returnGrades': false,
      };'
 */

function uploadGradesToClassroom(strdata) {

  var ss = SpreadsheetApp.getActive();
  if (arguments.length != 0) {
    Logger.log(strdata);
    data = JSON.parse(strdata);
  }
  Logger.log(data);
  courseId = getCourseIdFromName(data.course);

  //create new course assignment
  if (data.createAssignment) {
    workDetails = createCourseDetails(data.assignment)
    Classroom.Courses.CourseWork.create(workDetails, courseId);
    Logger.log("classwork created" + data.assignment);
  }
  //find course assignment
  var work = Classroom.Courses
    .CourseWork
    .list(courseId)
    .courseWork.find(obj => {
      return obj.title == data.assignment
    });
  if (courseId == null || work == null) {
    throw ('could find course work, course id or course work null');
  }
  //convert A1notation to indices
  data.indices = convertRangeToIndices(data.range);
  Logger.log(data.indices);
  Logger.log(work);
  if (data.returnGrades) {
    data.updateMask = { 'updateMask': 'draftGrade' };
  } else {
    data.updateMask = { 'updateMask': 'draftGrade' };
  }

  var str = readGradesFromSheetToClassroom(courseId, work, data);
  //ss.getActiveSheet().getCurrentCell().setValue('uffffffffff');
  return str;

}



/** 
 * This reads spread sheet data row by row,
 * searches student and submission and updates its grade by calling doPatch..
 * @courseId
 * @work a single instance of CourseWork
 * @data {
      'course':'courseTitle',
      'assignment': 'assignmentTitle',
      'range':'A1:B100',
      'indices':
        [{
          "range": 'A1:B100',
          "emailCol": 0,
          "gradeCol": 1,
          "startIndex": 1,
          "endIndex": 100
        }],
      'createAssignment': 0,
      'returnGrades': 0,
      };
 */
function readGradesFromSheetToClassroom(courseId, work, data) {
  if (courseId == null || work == null) {
    throw ('could find course work, course id or course work null');
  }
  sheet = SpreadsheetApp.getActive().getActiveSheet();
  indices = data.indices;
  // This represents ALL the data
  Logger.log(indices.startIndex + "-" + indices.emailCol + "-" + indices.endIndex);
  var emails = sheet
    .getRange(indices.startIndex, indices.emailCol + 1, indices.endIndex)
    .getValues();
  var grades = sheet
    .getRange(indices.startIndex, indices.gradeCol + 1, indices.endIndex)
    .getValues();

  var studentSubmissions = Classroom.Courses.CourseWork
    .StudentSubmissions.list(courseId, work.id)
    .studentSubmissions;


  for (var i = 0; i < emails.length; i++) {
    // Activate the corresponding cells
    var emailCell = sheet.getRange(indices.startIndex + i, indices.emailCol);
    emailCell.activate();
    emailCell.setBackgroundRGB(0, 0, 125);
    var gradeCell = sheet.getRange(indices.startIndex + i, indices.gradeCol);
    gradeCell.activate();
    gradeCell.setBackgroundRGB(0, 0, 125);

    email = emails[i][0];
    grade = grades[i][0];
    Logger.log('read email-grade:' + email + '-' + grade);

    if (email == null || email == '' || email.indexOf('@') == -1 || grade == null) {
      Logger.log('No email, skipped ' + email);
      continue;
    }

    //get student by email
    var student = Classroom.Courses.Students.get(courseId, email);
    if (student == null) {
      gradeCell.setBackgroundRGB(200, 200, 255);
      emailCell.setBackgroundRGB(200, 200, 255);
      Logger.log('not found student id for email:' + email);
      continue;
      throw ('not found student id for email:' + email);
    }
    //find student's submission
    var submission = studentSubmissions.find(obj => {
      return obj.userId == student.userId
    });

    if (submission == null) {
      gradeCell.setBackgroundRGB(200, 200, 255);
      emailCell.setBackgroundRGB(200, 200, 255);
      Logger.log('not found submission id for email:' + email);
      continue;
      throw ('not found submission id for email:' + email);
    }
    //patch to student's grade to classroom

    doPatchOnDraftGrade(courseId, work.id, submission.id, grade);
    Logger.log("updated grade for " + email + grade);
    gradeCell.setBackgroundRGB(200, 255, 200);
    emailCell.setBackgroundRGB(200, 255, 200);

  }
}

