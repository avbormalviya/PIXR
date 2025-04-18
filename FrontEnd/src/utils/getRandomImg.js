const defaultImageUrl = [
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795825/809883_qa9wfz.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795824/2180138_fls1yy.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795824/1155025_prhex6.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795824/1851464_lseao6.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795824/1155198_s3tc61.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795824/340557_pm59gt.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795824/2180141_egykgi.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744795823/1833146_kxw3in.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744798250/green-abstract-3d-5120x5120-21975_1_icyai0.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744798064/colorful-background-4096x3112-11043_m9i2d9.jpg",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744798062/bright-marbles-5k-5120x2880-18216_w8s6f6.png",
    "https://res.cloudinary.com/dr6gycjza/image/upload/v1744798061/ultrawide-blue-6400x2880-19825_wzephz.png"
]

export function getRandomImageUrl() {
    return defaultImageUrl[Math.floor(Math.random() * defaultImageUrl.length)];
}
