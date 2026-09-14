export type Role = "admin" | "teacher" | "student";

export interface Group {
	id: number;
	name: string;
	teacher: number | null;
	teacher_name: string | null;
	student_count: number;
	created_at: string;
}
export interface User {
	id: number;
	username: string;
	full_name: string;
	phone_number: string;
	passport_number: string;
	group: number | null;
	group_name: string | null;
	birth_date: string;
	course: string;
	faculty: string;
	payment_method: string;
	gap: number | null;
	image: string | null;
	image_url: string | null;
	role: Role;
	is_active: boolean;
}
export interface Location {
	id: number;
	name: string;
	point_1_lat: string;
	point_1_lng: string;
	point_2_lat: string;
	point_2_lng: string;
	point_3_lat: string;
	point_3_lng: string;
	point_4_lat: string;
	point_4_lng: string;
	is_active: boolean;
	created_at: string;
}
export interface Schedule {
	id: number;
	weekday: number;
	location: number;
	location_detail: Location;
	groups: number[];
	group_details: Group[];
	is_active: boolean;
	created_at: string;
}
export interface AttendanceStep {
	step: number;
	start: string;
	end: string;
	status: "completed" | "available" | "locked" | "missed";
}
export interface TodayAttendance {
	has_schedule: boolean;
	date: string;
	server_time?: string;
	schedule_id?: number;
	location?: { id: number; name: string };
	steps: AttendanceStep[];
}
export interface AttendanceRecord {
	id: number;
	attendance: number;
	step: number;
	captured_image: string;
	ip_address: string;
	latitude: string;
	longitude: string;
	location: number;
	location_name: string;
	face_distance: number | null;
	face_threshold: number | null;
	face_verified: boolean;
	liveness_passed: boolean;
	checked_at: string;
}
export interface Attendance {
	id: number;
	student: number;
	student_name: string;
	schedule: number;
	date: string;
	records: AttendanceRecord[];
	created_at: string;
}
export interface Assignment {
	id: number;
	teacher: number;
	teacher_name: string;
	title: string;
	description: string;
	file: string | null;
	deadline: string;
	groups: number[];
	submitted: boolean;
	my_submission_id: number | null;
	created_at: string;
	updated_at: string;
}
export interface Submission {
	id: number;
	assignment: number;
	assignment_title: string;
	student: number;
	student_name: string;
	file: string;
	submitted_at: string;
	grade: number | null;
	feedback: string;
	graded_at: string | null;
	graded_by: number | null;
}
