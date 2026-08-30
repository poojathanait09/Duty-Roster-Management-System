
create table organizations (
	id int auto_increment primary key,
    name varchar(100) not null,
    industry varchar(50)
    );

create table users (
	id int auto_increment primary key,
    organization_id int,
    department_id int null,
    
    name varchar(100) not null, 
    email varchar(100) unique not null,
    password varchar(255) not null,
    
    role enum('ADMIN', 'MANAGER', 'EMPLOYEE') not null,
    
    foreign key (organization_id)
		references organizations(id)
        );
        
create table departments (
	id int auto_increment primary key, 
    organization_id int, 
    name varchar(100) not null,
    manager_id int null,
    
    foreign key (organization_id)
		references organizations(id),
        
	foreign key (manager_id)
		references users(id)
        
	);
    
    
create table shifts(
	id int auto_increment primary key,
    department_id int,
    name varchar(50) not null,
    start_time time not null,
    end_time time not null,
    
    foreign key (department_id)
		references departments(id)
        
	);
    
    
create table leaves (
	id int auto_increment primary key,
    employee_id int,
    start_date date not null,
    end_date date not null,
    reason varchar(255),
    status enum('PENDING','APPROVED', 'REJECTED')
		default 'PENDING',
	foreign key (employee_id)
		references users(id)
        );
        
        
create table rosters (
	id int auto_increment primary key,
    department_id int,
    start_date date,
    end_date date,
    status enum('DRAFT','PUBLISHED')
		default 'DRAFT',
	foreign key (department_id) 
		references departments(id)
	);
    
    
create table roster_assignments (
	id int auto_increment primary key,
    roster_id int,
    employee_id int,
    shift_id int,
    duty_date date,
    
    foreign key (roster_id)
		references rosters(id),
	
    foreign key (employee_id)
		references users(id),
	
    foreign key (shift_id)
		references shifts(id)
        );
        
        
alter table organizations add working_days int default 7;

alter table users add manager_code varchar(20) null;
    

