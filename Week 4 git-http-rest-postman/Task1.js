const students = [
  { id: 1, name: "Ali Usman", marks: [70, 80, 65] },
  { id: 2, name: "Tauqir", marks: [90, 85, 88] },
  { id: 3, name: "Umair", marks: [45, 55, 50] }
];

// calculate average marks for every student
function calculateAverages(studentList) {
  const result = [];
  for (let i = 0; i < studentList.length; i++) {
    const student = studentList[i];

    let total = 0;
    for (let j = 0; j < student.marks.length; j++) {
      total = total + student.marks[j];
    }

    const average = Math.round((total / student.marks.length) * 100) / 100;

    result.push({
      id: student.id,
      name: student.name,
      marks: student.marks,
      average: average
    });
  }
  return result;
}

// add a grade property based on the average
function addGrades(studentList) {
  const result = [];
  for (let i = 0; i < studentList.length; i++) {
    const student = studentList[i];

    let grade;
    if (student.average >= 90) grade = "A";
    else if (student.average >= 80) grade = "B";
    else if (student.average >= 70) grade = "C";
    else if (student.average >= 60) grade = "D";
    else grade = "F";

    result.push({
      id: student.id,
      name: student.name,
      marks: student.marks,
      average: student.average,
      grade: grade
    });
  }
  return result;
}

// run both steps together (average + grade) 
function processStudents(studentList) {
  return addGrades(calculateAverages(studentList));
}

// return students who passed (using 50 as the passing average)
function getPassedStudents(studentList) {
  const processed = processStudents(studentList);
  const result = [];
  for (let i = 0; i < processed.length; i++) {
    if (processed[i].average >= 50) {
      result.push(processed[i]);
    }
  }
  return result;
}

// sort students by average marks, highest first (bubble sort)
function sortByAverage(studentList) {
  const processed = processStudents(studentList);

  for (let i = 0; i < processed.length; i++) {
    for (let j = 0; j < processed.length - i - 1; j++) {
      if (processed[j].average < processed[j + 1].average) {
        const temp = processed[j];
        processed[j] = processed[j + 1];
        processed[j + 1] = temp;
      }
    }
  }

  return processed;
}

// find the highest-scoring student
function getTopStudent(studentList) {
  const processed = processStudents(studentList);
  let top = processed[0];
  for (let i = 1; i < processed.length; i++) {
    if (processed[i].average > top.average) {
      top = processed[i];
    }
  }
  return top;
}

// calculate overall class average
function getClassAverage(studentList) {
  const processed = processStudents(studentList);
  let total = 0;
  for (let i = 0; i < processed.length; i++) {
    total = total + processed[i].average;
  }
  return Math.round((total / processed.length) * 100) / 100;
}

console.log("Students with average + grade:", processStudents(students));
console.log("Passed students:", getPassedStudents(students));
console.log("Sorted by average:", sortByAverage(students));
console.log("Top student:", getTopStudent(students));
console.log("Class average:", getClassAverage(students));
console.log("Original array is still unchanged:", students);