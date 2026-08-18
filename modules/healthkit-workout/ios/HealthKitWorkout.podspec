Pod::Spec.new do |s|
  s.name             = 'HealthKitWorkout'
  s.version          = '0.1.0'
  s.summary          = 'Local HealthKit workout bridge for Gym Tracker'
  s.description      = 'Provides the narrow native HealthKit workout API used by Gym Tracker.'
  s.author           = 'Vlad'
  s.homepage         = 'https://github.com/vn-co/gym-app'
  s.platforms        = { :ios => '16.4' }
  s.source           = { git: 'https://github.com/vn-co/gym-app.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
