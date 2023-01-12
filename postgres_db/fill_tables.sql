-- Set params
set session my.user_id = 0;
set session my.name = 'สมชาย';
set session my.surname = 'ใจดี';
set session my.email = 'test@hotmail.com';
set session my.password = '123456';
set session my.tel_number = '0811111111';
set session my.role = 'admin';

-- Filling of users
INSERT INTO users VALUES 
	(CAST(current_setting('my.user_id') AS int),current_setting('my.name'), current_setting('my.surname'), current_setting('my.email'), current_setting('my.password'), current_setting('my.tel_number'), current_setting('my.role'));