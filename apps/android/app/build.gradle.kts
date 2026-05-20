plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.aiengineeringcode.shell"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aiengineeringcode.shell"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField("String", "H5_DEV_URL", "\"http://10.0.2.2:3000\"")
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
}
