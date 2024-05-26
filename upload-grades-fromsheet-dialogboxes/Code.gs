/**
 * update grades from google spreadsheet to google classroom: 
 * it is written for personal use to just upload grades of my courses, it may include a few bugs:
 * Creates a spreadsheet menu after getting course&assignmentname,
 * it uploads grades (given as emails-grade in column A and B) to classroom. 
 * the uploaded grades are colored green...
 * The code is mostly self explanatory...
 * adaskin,2023
 */

/*

/**
 * runs on open
 */
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Upload grades to classroom')
    .addItem('Upload grades to classroom', 'uploadDataToClassroom')
    .addToUi();
}


/**
 */
function uploadDataToClassroom(list = '', sheetName = 'new') {


  // Next, we will get the Spreadsheet and Course Name from the user
  var spreadsheet = SpreadsheetApp.getActiveSheet();
  // Get the Spreadsheet UI 
  var ui = SpreadsheetApp.getUi();

  // Create a prompt for the user to enter the courseName
  var courseName = ui.prompt("Please enter the courseName:").getResponseText();
  var course = Classroom.Courses.list().courses.find(function (e) {
    if (e.name == courseName) return e;
  });
  Logger.log(course);

  // Create a prompt for the user to enter assignment name
  var assignmentName = ui.prompt("Please enter the assignmentName:").getResponseText();
  var assignment = Classroom.Courses.CourseWork.list(course.id).courseWork.find(function (e) {
    if (e.title == assignmentName) return e;
  });
  if (assignment == null) {
    var assginmentDetails = createAssignmentDetails(assignmentName);
    assignment = Classroom.Courses.CourseWork.create(assginmentDetails, course.id);
  }
  Logger.log(assignment);



  // Get the email and grade values from the Spreadsheet
  var emailValues = spreadsheet.getRange('A2:A').getValues();
  var gradeValues = spreadsheet.getRange('B2:B').getValues();

  // Now we will loop through the email and grade values
  for (var i = 0; i < emailValues.length; i++) {

    // Get the email and grade
    var studentEmail = emailValues[i][0];
    if (!studentEmail) break;
    var studentGrade = gradeValues[i][0];

    // Activate the corresponding cells
    var emailCell = spreadsheet.getRange(i + 2, 1);
    emailCell.activate();
    emailCell.setBackgroundRGB(0, 0, 125);
    var gradeCell = spreadsheet.getRange(i + 2, 2);
    gradeCell.activate();
    gradeCell.setBackgroundRGB(0, 0, 125);
    var student = null;
    try {
      // Now we will check if the student is enrolled in the cours
      student = Classroom.Courses.Students.get(course.id, studentEmail);
    } catch (e) {
      //continue;
    }
    // If the student is enrolled, then we will upload the grade to the Classroom
    if (student) {
      var submission = Classroom.Courses.CourseWork.StudentSubmissions
        .list(course.id, assignment.id)
        .studentSubmissions
        .find(obj => { return obj.userId == student.userId });
      doPatchOnDraftGrade(course.id, assignment.id, submission.id, studentGrade);
      gradeCell.setBackgroundRGB(200, 255, 200);
      emailCell.setBackgroundRGB(200, 255, 200);
    } else {
      gradeCell.setBackgroundRGB(255, 200, 200);
      emailCell.setBackgroundRGB(255, 200, 200);
    }

  }
}
/**
 * updates the grade of a given submission
 */
function doPatchOnDraftGrade(id, workId, submissionId, grade,
  upDate = { 'updateMask': 'draftGrade' }) {

  var studentSubmission = Classroom.newStudentSubmission();
  var studentSubmission = {
    'draftGrade': grade,
    'assignedGrade': grade
  };

  Classroom.Courses.CourseWork.StudentSubmissions
    .patch(
      studentSubmission,
      id,
      workId,
      submissionId,
      upDate
    );
}
/**
 * given title, creates new assignment details for a given title
 */
function createAssignmentDetails(title) {
  var workDetails = {
    title: title,
    state: "PUBLISHED",
    description: "",
    maxPoints: 100,
    /*materials: [
      {
        driveFile:{
        driveFile: {
          id: "fileID", 
          title: "Sample Document"
  
        },
        shareMode: "STUDENT_COPY"
        }
  
      }
      ],
      */
    workType: "ASSIGNMENT"
  }
  return workDetails;
}

