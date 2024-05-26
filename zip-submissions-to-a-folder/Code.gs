/**
 * zips student submissions into a drive folder with students emails as the zip-names
 */

var courseName = '....';
var workTitle = "....";

// the name of the drive folder to be created 
var folderName = 'new assignments to download';

function myFunction() {
  options = { pageSize: 50 };
  var course = Classroom.Courses
                .list()
                .courses
                .find(obj => obj.name == courseName);
  var courseWork = Classroom.Courses.CourseWork
                    .list(course.id)
                    .courseWork
                    .find(obj => obj.title == workTitle);
  var studentSubmissions = Classroom.Courses.CourseWork.StudentSubmissions
                            .list(course.id, courseWork.id)
                            .studentSubmissions;
  var students = [];
  do {
    var s = Classroom.Courses.Students.list(course.id, options);
    options.pageToken = s.nextPageToken;

    Array.prototype.push.apply(students, s.students);

    Logger.log('length:' + students.length);
  } while (options.pageToken);

  Logger.log('length:' + students.length);


  var folder = DriveApp.createFolder(folderName);

  studentSubmissions.forEach(
    function (submission) {
      var student = students.find(obj => obj.userId == submission.userId);
      Logger.log(student.userId + "-" + submission.userId);
      var attachments = submission.assignmentSubmission.attachments;
      if (attachments && submission.assignedGrade != 0) {
        var zipContent = [];
        for (var i = 0; i < attachments.length; i++) {
          if (attachments[i].driveFile) {
            var file = DriveApp.getFileById(attachments[i].driveFile.id).makeCopy().getBlob();
            zipContent.push(file);

            // change name moveto 
            // file.setName(student.profile.emailAddress);
            //file.moveTo(folder);
          }

        }
        if (zipContent) {
          var zip = Utilities.zip(zipContent, student.profile.emailAddress);
          folder.createFile(zip);
        }
      }
    });
}
