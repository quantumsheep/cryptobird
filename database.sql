CREATE DATABASE IF NOT EXISTS cryptobird DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
USE cryptobird;

CREATE TABLE `USER` (
	`id` int NOT NULL AUTO_INCREMENT,
	`email` varchar(320) NOT NULL UNIQUE,
	`username` varchar(254) NOT NULL UNIQUE,
	`password` BINARY(60) NOT NULL,
	`createddate` DATETIME NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `MESSAGE` (
	`id` int NOT NULL AUTO_INCREMENT,
	`room` int NOT NULL,
	`sender` int NOT NULL,
	`content` TEXT NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `ROOM` (
	`id` int NOT NULL AUTO_INCREMENT,
	`status` bit NOT NULL,
	`access` int(1) NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `ROOM_USER` (
	`user` int NOT NULL,
	`room` int NOT NULL,
	`status` bit NOT NULL,
	`nickname` varchar(254) NOT NULL,
	PRIMARY KEY (`user`,`room`)
);

ALTER TABLE `MESSAGE` ADD CONSTRAINT `MESSAGE_fk0` FOREIGN KEY (`room`) REFERENCES `ROOM`(`id`);

ALTER TABLE `MESSAGE` ADD CONSTRAINT `MESSAGE_fk1` FOREIGN KEY (`sender`) REFERENCES `USER`(`id`);

ALTER TABLE `ROOM_USER` ADD CONSTRAINT `ROOM_USER_fk0` FOREIGN KEY (`user`) REFERENCES `USER`(`id`);

ALTER TABLE `ROOM_USER` ADD CONSTRAINT `ROOM_USER_fk1` FOREIGN KEY (`room`) REFERENCES `ROOM`(`id`);
