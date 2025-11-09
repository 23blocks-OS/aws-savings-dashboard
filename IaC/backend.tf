terraform {
  backend "s3" {
    # Uncomment and configure for remote state
    # bucket         = "your-terraform-state-bucket"
    # key            = "aws-savings-dashboard/terraform.tfstate"
    # region         = "us-east-1"
    # encrypt        = true
    # dynamodb_table = "terraform-state-lock"
  }
}
