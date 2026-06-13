use std::thread;

fn main() {
    // Spawn three threads
    for _ in 0..3 {
         thread::spawn(|| {
            let mut counter: f64 = 0.0;
            loop {
                counter += 0.001;
            }
        });

        loop {
            // Main thread does nothing
        }
    }
   
    // println!("Hello, world!");
}
