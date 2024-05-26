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
 * given course name returns its id
 */
function getCourseIdFromName(courseName) {
  var course = Classroom.Courses.list().courses.find(obj => {
    return obj.name == courseName;
  });
  if (!course) throw ('course name not found');
  Logger.log(" final course.name: " + course.name)
  return course.id;
}

/**
 * given work title, and course id, returns work id.
 */
function getworkIdFromWorkTitle(id, courseWorkTitle) {

  var courseWork = Classroom.Courses.CourseWork.list(id)
    .courseWork.find(obj => { return obj.name == courseWorkTitle; });

  Logger.log("found course work name:" + courseWork.title);
  return courseWork.Id;
}

/**
 * given title, creates new assignment details for a given title
 */
function createCourseDetails(workTitle) {
  var workDetails = {
    title: workTitle,
    state: "DRAFT",
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

/**
 * creates new assignment
 */
function createNewAssignment(course, assignmentTitle) {
  if (arguments.length < 1) {
    assignmentTitle = data.assignment;
    courseId = getCourseIdFromName(data.course);

  }
  workDetails = createCourseDetails(assignmentTitle)
  Classroom.Courses.CourseWork.create(workDetails, courseId);
  Logger.log("classwork created" + data.assignment);
}


/**
 * returns course list
 * from classroom names as JSON string 
 * saves courseID{}&names for future uses..
 */
function getCourseList() {
  var courses = [];
  var courseIds = [];
  try {
    Classroom.Courses.list({ "courseStates": ["ACTIVE"] }).courses.
      forEach(function (e) {
        if (e.courseState != 'ARCHIVED') {
          courses.push(e.name);
          courseIds.push(e.id);
        }
      });
  } catch (e) {
    throw ('cannot read courses', e.error);
  }
  Logger.log(courses);
  // var documentProperties = PropertiesService.getDocumentProperties();
  // documentProperties.setProperty("COURSE_IDS", JSON.stringify(courseIds));
  return JSON.stringify(courses);
}
